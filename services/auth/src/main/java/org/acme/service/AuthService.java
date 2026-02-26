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

import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.NewCookie;

@ApplicationScoped
public class AuthService {

	@Inject
	UserRepository userRepository;

	@Inject
	SessionRepository sessionRepository;

	@ConfigProperty(name = "app.domain.name", defaultValue = "localhost")
	String domain;

	@ConfigProperty(name = "refresh.expiry", defaultValue = "86400")
	Long refreshExpiry;

	@ConfigProperty(name = "access.expiry", defaultValue = "600")
	Long accessExpiry;

	@Transactional
	public UserResponseDTO createToken(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		if (user == null)
			throw new WebApplicationException("User not found in identity", 401);
		if (user.isBanned)
			throw new WebApplicationException("User is banned", 403);

		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		return new UserResponseDTO(accessToken, accessExpiry,
			new UserInfoDTO(user));
	}

	@Transactional
	public NewCookie createSessionCookie(SecurityIdentity identity) {
		User user = identity.getAttribute("user");
		if (user == null)
			throw new WebApplicationException("User not found in identity", 401);
		if (user.isBanned)
			throw new WebApplicationException("User is banned", 403);
		Instant expiry = Instant.now().plusSeconds(refreshExpiry);

		String sessionId = UUID.randomUUID().toString();
		Session newSession = new Session();
		newSession.sessionId = sessionId;
		newSession.userId = user.id;
		newSession.expiresAt = expiry;

		sessionRepository.persist(newSession);

		NewCookie cookie = new NewCookie.Builder("sessionId")
			.value(sessionId)
			.path("/")
			.domain(domain)
			.expiry(Date.from(expiry))
			.maxAge(refreshExpiry.intValue())
			.sameSite(NewCookie.SameSite.LAX)
			.secure(false) // Set to true in production with HTTPS
			.httpOnly(true)
			.comment("The session id that should be sent to refresh the access token")
			.build();

		return cookie;
	}

	@Transactional
	public UserResponseDTO refreshToken(String sessionId) {
		if (sessionId == null || sessionId.isEmpty())
			throw new WebApplicationException("Session ID is required", 401);

		Session session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> new WebApplicationException("Session not found", 404));

		if (session.expiresAt.isBefore(Instant.now())) {
			sessionRepository.delete(session);
			throw new WebApplicationException("Session expired", 401);
		}

		User user = userRepository.findById(session.userId);
		if (user == null)
			throw new WebApplicationException("User not found", 404);
		if (user.isBanned)
			throw new WebApplicationException("User is banned", 403);

		String accessToken = Jwt
				.subject(String.valueOf(user.id))
				.upn(user.email)
				.groups(Set.of(user.role.name()))
				.sign();

		return new UserResponseDTO(accessToken, accessExpiry,
			new UserInfoDTO(user));
	}

	@Transactional
	public NewCookie deleteSession(String sessionId) {
		if (sessionId == null || sessionId.isEmpty())
			throw new WebApplicationException("Session ID is required", 401);

		Session session = sessionRepository.findBySessionId(sessionId)
				.orElseThrow(() -> new WebApplicationException("Session not found", 404));

		sessionRepository.delete(session);
		return new NewCookie.Builder("sessionId")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(false) // Set to true in production with HTTPS
			.httpOnly(true)
			.comment("The session id to replace the old one, effectively logging out the user")
			.build();
	}

	@Transactional
	public NewCookie deleteAccount(SecurityIdentity identity) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null)
			throw new WebApplicationException("User not found in identity", 401);

		User user = userRepository.findById(userInIdentity.id);
		if (user == null)
			throw new WebApplicationException("User not found", 404);

		userRepository.delete(user);
		return new NewCookie.Builder("sessionId")
			.value("")
			.path("/")
			.domain(domain)
			.maxAge(0)
			.secure(false) // Set to true in production with HTTPS
			.httpOnly(true)
			.comment("The session id to replace the old one, effectively deleting the user")
			.build();
	}

	public UserInfoDTO getMyInfo(SecurityIdentity identity) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null)
			throw new WebApplicationException("User not found in identity", 401);

		User user = userRepository.findById(userInIdentity.id);
		if (user == null)
			throw new WebApplicationException("User not found", 404);
		if (user.isBanned)
			throw new WebApplicationException("User is banned", 403);

		return new UserInfoDTO(user);
	}

	@Transactional
	public UserInfoDTO updateMyInfo(SecurityIdentity identity, UserUpdateDTO updateDTO) {
		User userInIdentity = identity.getAttribute("user");
		if (userInIdentity == null)
			throw new WebApplicationException("User not found in identity", 404);

		User user = userRepository.findById(userInIdentity.id);
		if (user == null)
			throw new WebApplicationException("User not found", 404);
		if (user.isBanned)
			throw new WebApplicationException("User is banned", 403);

		updateDTO.fullName.ifPresent(newValue -> user.fullName = newValue );
		updateDTO.avatarUrl.ifPresent(newValue -> user.avatarUrl = newValue );
		updateDTO.bio.ifPresent(newValue -> user.bio = newValue );
		updateDTO.username.ifPresent(newValue -> {
			if (userRepository.findByUsername(newValue).isPresent()) {
				throw new WebApplicationException("Username already taken", 409);
			}
			user.username = newValue;
		});

		userRepository.persist(user);

		return new UserInfoDTO(user);
	}

	@Transactional
	public List<@NonNull UserSummaryDTO> searchUser(String query, int page, int size) {
		return userRepository.searchByName(query, page, size);
	}

	@Transactional
	public UserInfoDTO getUserInfo(Long userId) {
		User user = userRepository.findById(userId);
		if (user == null)
			throw new WebApplicationException("User not found", 404);

		return new UserInfoDTO(user);
	}

	// @ConfigProperty(name = "public.key", defaultValue = "PUBLIC_KEY_PLACEHOLDER")
	// String publicKey;
// 
	// public String getPublicKey() {
		// return publicKey;
	// }

	// private User getUserFromJWT(SecurityIdentity identity) {
		// Long userId;
        // 
        // // if (identity.getPrincipal() instanceof JsonWebToken jwt) {
            // // String sub = jwt.getSubject();
            // try {
                // // userId = Long.valueOf(sub);
            // // } catch (NumberFormatException e) {
                // // throw new WebApplicationException("Invalid token subject: " + sub, 401);
            // }
        // } else {
            // // throw new WebApplicationException("Expected JWT principal but got: " + 
                // // identity.getPrincipal().getClass().getName(), 401);
        // }
// 
        // // User user = userRepository.findById(userId);
        // // if (user == null)
            // // throw new WebApplicationException("User not found", 404);
        // return user;
	// }
}
