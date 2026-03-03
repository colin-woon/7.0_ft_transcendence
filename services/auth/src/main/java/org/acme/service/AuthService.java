package org.acme.service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.acme.dto.UserInfoDTO;
import org.acme.dto.UserResponseDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.dto.UserUpdateDTO;
import org.acme.model.Session;
import org.acme.model.User;
import org.acme.repository.SessionRepository;
import org.acme.repository.UserRepository;
import org.eclipse.jdt.annotation.NonNull;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.jwt.build.Jwt;
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

	@ConfigProperty(name = "app.domain.name", defaultValue = "localhost")
	String domain;

	@ConfigProperty(name = "REFRESH_EXPIRY", defaultValue = "86400")
	Long refreshExpiry;

	@ConfigProperty(name = "ACCESS_EXPIRY", defaultValue = "600")
	Long accessExpiry;

	@ConfigProperty(name = "secure.cookies", defaultValue = "false")
	Boolean secureCookies;

	@ConfigProperty(name = "max.sessions.per.user", defaultValue = "5")
	Integer maxSessionsPerUser;

	@Transactional
	public UserResponseDTO createToken(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		if (user == null) {
			LOG.error("User not found in identity during token creation");
			throw new WebApplicationException("User not found in identity", 401);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to login: " + user.email);
			throw new WebApplicationException("User is banned", 403);
		}

		LOG.info("Creating access token for user: " + user.email);
		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		return new UserResponseDTO(accessToken, Instant.now().plusSeconds(accessExpiry),
			new UserInfoDTO(user));
	}

	@Transactional
	public NewCookie createSessionCookie(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		if (user == null) {
			LOG.error("User not found in identity during session creation");
			throw new WebApplicationException("User not found in identity", 401);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to create session: " + user.email);
			throw new WebApplicationException("User is banned", 403);
		}
		Instant expiry = Instant.now().plusSeconds(refreshExpiry);

		String sessionId = UUID.randomUUID().toString();
		Session newSession = new Session();
		newSession.sessionId = sessionId;
		newSession.userId = user.id;
		newSession.expiresAt = expiry;

		sessionRepository.persist(newSession);
		LOG.info("Created session for user: " + user.email);

		long sessionCount = sessionRepository.countByUserId(user.id);
		if (sessionCount >= maxSessionsPerUser) {
			LOG.debug("User " + user.email + " exceeded max sessions, cleaning up oldest");
			Session oldestSession = sessionRepository.findOldestByUserId(user.id).orElse(null);
			if (oldestSession != null) {
				sessionRepository.delete(oldestSession);
			}
		}

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

	@Transactional
	public UserResponseDTO refreshToken(String sessionId) {
		if (sessionId == null || sessionId.isEmpty()) {
			LOG.warn("Refresh attempted without session ID");
			throw new WebApplicationException("Session ID is required", 401);
		}

		Session session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> {
					LOG.warn("Refresh attempted with invalid session ID");
					return new WebApplicationException("Session not found", 404);
				});

		if (session.expiresAt.isBefore(Instant.now())) {
			LOG.info("Expired session deleted: " + sessionId);
			sessionRepository.delete(session);
			throw new WebApplicationException("Session expired", 401);
		}

		User user = userRepository.findById(session.userId);
		if (user == null) {
			LOG.error("User not found for session: " + sessionId);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted refresh: " + user.email);
			throw new WebApplicationException("User is banned", 403);
		}

		LOG.debug("Refreshing token for user: " + user.email);
		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		return new UserResponseDTO(accessToken, Instant.now().plusSeconds(accessExpiry),
			new UserInfoDTO(user));
	}

	@Transactional
	public NewCookie deleteSession(String sessionId) {
		if (sessionId == null || sessionId.isEmpty()) {
			LOG.warn("Logout attempted without session ID");
			throw new WebApplicationException("Session ID is required", 401);
		}

		Session session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> {
					LOG.warn("Logout attempted with invalid session ID");
					return new WebApplicationException("Session not found", 404);
				});

		sessionRepository.delete(session);
		LOG.info("Session deleted (logout): " + sessionId);
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

	@Transactional
	public NewCookie deleteAccount(SecurityIdentity identity) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null) {
			LOG.error("User not found in identity during account deletion");
			throw new WebApplicationException("User not found in identity", 401);
		}

		User user = userRepository.findById(userInIdentity.id);
		if (user == null) {
			LOG.error("User not found for deletion: " + userInIdentity.id);
			throw new WebApplicationException("User not found", 404);
		}

		LOG.warn("Deleting user account: " + user.email);
		userRepository.delete(user);
		return new NewCookie.Builder("sessionId")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(secureCookies)
			.httpOnly(true)
			.comment("The session id to replace the old one, effectively deleting the user")
			.build();
	}

	public UserInfoDTO getMyInfo(SecurityIdentity identity) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null) {
			LOG.error("User not found in identity");
			throw new WebApplicationException("User not found in identity", 401);
		}

		User user = userRepository.findById(userInIdentity.id);
		if (user == null) {
			LOG.error("User not found: " + userInIdentity.id);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to access profile: " + user.email);
			throw new WebApplicationException("User is banned", 403);
		}

		return new UserInfoDTO(user);
	}

	@Transactional
	public UserInfoDTO updateMyInfo(SecurityIdentity identity, UserUpdateDTO updateDTO) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null) {
			LOG.error("User not found in identity during profile update");
			throw new WebApplicationException("User not found in identity", 404);
		}

		User user = userRepository.findById(userInIdentity.id);
		if (user == null) {
			LOG.error("User not found for update: " + userInIdentity.id);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to update profile: " + user.email);
			throw new WebApplicationException("User is banned", 403);
		}

		updateDTO.fullName.ifPresent(newValue -> user.fullName = newValue );
		updateDTO.avatarUrl.ifPresent(newValue -> user.avatarUrl = newValue );
		updateDTO.bio.ifPresent(newValue -> user.bio = newValue );
		updateDTO.username.ifPresent(newValue -> {
			if (userRepository.findByUsername(newValue).isPresent()) {
				LOG.warn("Username already taken: " + newValue);
				throw new WebApplicationException("Username already taken", 409);
			}
			user.username = newValue;
			LOG.info("Username updated for user: " + user.email);
		});

		userRepository.persist(user);

		return new UserInfoDTO(user);
	}

	@Transactional
	public List<@NonNull UserSummaryDTO> searchUser(String query, int page, int size) {
		if (page < 0) {
			page = 0;
		}
		if (size < 1 || size > 100) {
			size = 10;
		}
		String safeQuery = (query == null) ? "" : query.trim();

		return userRepository.searchByName(safeQuery, page, size);
	}

	@Transactional
	public UserInfoDTO getUserInfo(Long userId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.debug("User not found: " + userId);
			throw new WebApplicationException("User not found", 404);
		}

		return new UserInfoDTO(user);
	}
}
