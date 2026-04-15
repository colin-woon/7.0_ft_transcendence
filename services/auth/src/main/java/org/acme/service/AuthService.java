package org.acme.service;

import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.acme.dto.IntraInfoDTO;
import org.acme.dto.SessionDTO;
import org.acme.dto.UserResponseDTO;
import org.acme.model.Session;
import org.acme.model.User;
import org.acme.repository.SessionRepository;
import org.acme.repository.UserRepository;
import org.eclipse.jdt.annotation.NonNull;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.jwt.build.Jwt;
import io.vertx.core.http.HttpServerRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.NewCookie;

@ApplicationScoped
public class AuthService {

	private static final Logger LOG = Logger.getLogger(AuthService.class);

	@Inject
	UserRepository userRepository;

	@Inject
	SessionRepository sessionRepository;

	@Inject
	DeviceParser deviceParser;

	@Inject
	HttpServerRequest request;

	@Inject
	AvatarStorageService avatarStorageService;

	@ConfigProperty(name = "app.domain.name", defaultValue = "localhost")
	String domain;

	@ConfigProperty(name = "refresh.expiry", defaultValue = "86400")
	Long refreshExpiry;

	@ConfigProperty(name = "access.expiry", defaultValue = "600")
	Long accessExpiry;

	@ConfigProperty(name = "secure.cookies", defaultValue = "false")
	Boolean secureCookies;

	@ConfigProperty(name = "max.sessions.per.user", defaultValue = "5")
	Integer maxSessionsPerUser;

	@Transactional
	public UserResponseDTO createToken(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		return createTokenForUser(user);
	}

	@Transactional
	public UserResponseDTO createTokenForUser(User user) {
		if (user == null) {
			LOG.error("User not found in identity during token creation");
			throw new WebApplicationException("User not found in identity", 401);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to login");
			throw new WebApplicationException("User is banned", 403);
		}

		LOG.debug("Issuing access token");
		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserResponseDTO(accessToken, Instant.now().plusSeconds(accessExpiry),
			avatarStorageService.toUserInfoDTO(user, intrainfo));
	}

	@Transactional
	public NewCookie createSessionCookie(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		return createSessionCookieForUser(user);
	}

	@Transactional
	public NewCookie createSessionCookieForUser(User user) {
		if (user == null) {
			LOG.error("User not found in identity during session creation");
			throw new WebApplicationException("User not found in identity", 401);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to create session");
			throw new WebApplicationException("User is banned", 403);
		}
		Instant expiry = Instant.now().plusSeconds(refreshExpiry);

		String sessionId = UUID.randomUUID().toString();
		Session newSession = new Session();
		newSession.sessionId = sessionId;
		newSession.userId = user.id;
		newSession.expiresAt = expiry;
		parseDeviceInfo(newSession);

		long sessionCount = sessionRepository.countByUserId(user.id);
		if (sessionCount >= maxSessionsPerUser) {
			LOG.debug("Max sessions reached, cleaning up oldest session");
			Session oldestSession = sessionRepository.findOldestByUserId(user.id).orElse(null);
			if (oldestSession != null) {
				sessionRepository.delete(oldestSession);
			}
		}

		sessionRepository.persist(newSession);
		LOG.debug("Created new session");

		NewCookie cookie = new NewCookie.Builder("sessionId")
			.value(sessionId)
			.path("/")
			.domain(domain)
			.expiry(Date.from(expiry))
			.maxAge(refreshExpiry.intValue())
			.sameSite(NewCookie.SameSite.LAX)
			.secure(secureCookies)
			.httpOnly(true)
			.comment("The session id that should be sent to refresh the access token")
			.build();

		return cookie;
	}

	public NewCookie[] clearOIDCCookies() {
		NewCookie clearDefault = new NewCookie.Builder("q_session")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(secureCookies)
			.httpOnly(true)
			.build();
		NewCookie clearGoogle = new NewCookie.Builder("q_session_google")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(secureCookies)
			.httpOnly(true)
			.build();
		NewCookie clear42 = new NewCookie.Builder("q_session_42")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(secureCookies)
			.httpOnly(true)
			.build();
		return new NewCookie[] { clearDefault, clearGoogle, clear42 };
	}

	public NewCookie createAccessTokenCookie(String accessToken) {
		return new NewCookie.Builder("accessToken")
			.value(accessToken)
			.path("/")
			.domain(domain)
			.expiry(Date.from(Instant.now().plusSeconds(accessExpiry)))
			.maxAge(accessExpiry.intValue())
			.sameSite(NewCookie.SameSite.LAX)
			.secure(secureCookies)
			.httpOnly(true)
			.comment("The access token for websocket and SSE use")
			.build();
	}

	@Transactional
	public UserResponseDTO refreshToken(String sessionId) {
		if (sessionId == null || sessionId.isEmpty()) {
			LOG.debug("Refresh attempted without session ID");
			throw new WebApplicationException("Session ID is required", 401);
		}

		Session session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> {
					LOG.debug("Refresh attempted with invalid session ID");
					return new WebApplicationException("Session not found", 404);
				});

		if (session.expiresAt.isBefore(Instant.now())) {
			LOG.debug("Expired session deleted");
			sessionRepository.delete(session);
			throw new WebApplicationException("Session expired", 401);
		}

		User user = userRepository.findById(session.userId);
		if (user == null) {
			LOG.warn("User not found for session");
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted refresh");
			throw new WebApplicationException("User is banned", 403);
		}

		LOG.debug("Refreshing access token");
		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserResponseDTO(accessToken, Instant.now().plusSeconds(accessExpiry),
			avatarStorageService.toUserInfoDTO(user, intrainfo));
	}

	@Transactional
	public NewCookie deleteSession(String targetSessionId, String cookieSessionId, Long userId) {
		String sessionToDelete = (targetSessionId != null && !targetSessionId.isEmpty())
			? targetSessionId : cookieSessionId;

		if (sessionToDelete == null || sessionToDelete.isEmpty()) {
			LOG.debug("Logout attempted without session ID");
			throw new WebApplicationException("Session ID is required", 401);
		}

		Session session = sessionRepository.findBySessionId(sessionToDelete)
				.orElseThrow(() -> {
					LOG.debug("Logout attempted with invalid session ID");
					return new WebApplicationException("Session not found", 404);
				});

		if (!session.userId.equals(userId)) {
			LOG.warn("Unauthorized session deletion attempt");
			throw new WebApplicationException("Unauthorized", 403);
		}

		sessionRepository.delete(session);
		LOG.debug("Session deleted during logout");

		if (sessionToDelete.equals(cookieSessionId)) {
			return new NewCookie.Builder("sessionId")
				.value("")
				.path("/")
				.domain(domain)
				.maxAge(0)
				.secure(secureCookies)
				.httpOnly(true)
				.build();
		}
		return null;
	}

	@Transactional
	public NewCookie deleteAllSessions(Long userId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.warn("User not found for global logout");
			throw new WebApplicationException("User not found", 404);
		}

		sessionRepository.deleteByUserId(userId);
		LOG.debug("Deleted all user sessions");
		return new NewCookie.Builder("sessionId")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(secureCookies)
			.httpOnly(true)
			.comment("The session id to replace the old one, effectively logging out the user")
			.build();
	}

	public List<@NonNull SessionDTO> listSessions(Long userId, String currentSessionId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.warn("User not found while listing sessions");
			throw new WebApplicationException("User not found", 404);
		}

		List<@NonNull Session> sessions = sessionRepository.findByUserId(userId);
		return sessions.stream()
			.map(s -> new SessionDTO(s.sessionId, s.sessionId.equals(currentSessionId), s.deviceType, s.browser,
				s.os, s.ipAddress, s.expiresAt, s.createdAt))
			.toList();
	}

	@SuppressWarnings("UseSpecificCatch")
	public Map<String, Object> healthCheck() {
		Map<String, Object> health = new HashMap<>();
		health.put("status", "ok");

		// 1. Database connectivity
		try {
			long userCount = userRepository.count();
			health.put("database", Map.of("status", "ok", "userCount", userCount));
		} catch (Exception e) {
			health.put("database", Map.of("status", "error", "message", e.getMessage()));
			health.put("status", "degraded");
		}

		// 2. Session store
		try {
			long activeSessionCount = sessionRepository.count();
			health.put("sessions", Map.of("status", "ok", "activeCount", activeSessionCount));
		} catch (Exception e) {
			health.put("sessions", Map.of("status", "error", "message", e.getMessage()));
			health.put("status", "degraded");
		}

		// 3. JWT signing capability (verify key is loaded)
		try {
			Jwt.subject("healthcheck").sign();
			health.put("jwt", Map.of("status", "ok"));
		} catch (Exception e) {
			health.put("jwt", Map.of("status", "error", "message", e.getMessage()));
			health.put("status", "degraded");
		}

		return health;
	}

	private void parseDeviceInfo(Session session) {
		String uaHeader = request.getHeader("User-Agent");
		if (uaHeader != null && !uaHeader.isBlank()) {
			var deviceInfo = deviceParser.parse(uaHeader);
			session.deviceType = deviceInfo.get("deviceType");
			session.browser = deviceInfo.get("browser");
			session.os = deviceInfo.get("os");
		}
		String forwarded = request.getHeader("X-Forwarded-For");
		session.ipAddress = forwarded != null
			? forwarded.split(",")[0].trim()
			: (request.remoteAddress() != null ? request.remoteAddress().host() : null);
	}
}
