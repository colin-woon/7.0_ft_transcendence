package org.acme.service;

import java.util.Locale;

import org.acme.dto.IntraDTO;
import org.acme.dto.PasswordChangeDTO;
import org.acme.dto.PasswordLoginDTO;
import org.acme.dto.PasswordRegisterDTO;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;
import org.hibernate.Hibernate;
import org.jboss.logging.Logger;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class UserService {

	private static final Logger LOG = Logger.getLogger(UserService.class);

	@Inject
	UserRepository userRepository;

	@Inject
	IntraService intraService;

	@Inject
	PasswordService passwordService;

	@Transactional
	public User syncUser(UserInfo info, String tenantId) {
		LOG.debug("Syncing user from OIDC tenant");
		User user = switch (tenantId) {
			case "google" -> syncByGoogle(info);

			case "42" -> syncBy42(info);
			
			default -> throw new WebApplicationException("Unknown provider: " + tenantId, 401);
		};
		// Initialize lazy relations while the session is still open,
		// since the User will be stored as a detached SecurityIdentity attribute
		Hibernate.initialize(user.intra);
		return user;
	}

	@Transactional
	public User registerWithPassword(PasswordRegisterDTO dto) {
		if (!dto.password.equals(dto.confirmPassword)) {
			throw new WebApplicationException("Password confirmation does not match", 400);
		}

		String normalizedEmail = normalizeEmail(dto.email);
		String normalizedUsername = dto.username.trim();

		userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
			throw new WebApplicationException("Account already exists", 409);
		});

		userRepository.findByUsername(normalizedUsername).ifPresent(existing -> {
			throw new WebApplicationException("Username already in use", 409);
		});

		User user = new User();
		user.email = normalizedEmail;
		user.username = normalizedUsername;
		user.fullName = dto.fullName.trim();
		user.avatarUrl = sanitizeOptional(dto.avatarUrl);
		user.bio = sanitizeOptional(dto.bio);
		user.role = UserRole.STUDENT;
		user.passwordHash = hashPassword(dto.password);

		userRepository.persist(user);
		return user;
	}

	public User authenticateWithPassword(PasswordLoginDTO dto) {
		String normalizedEmail = normalizeEmail(dto.email);
		User user = userRepository.findByEmail(normalizedEmail).orElseThrow(() -> new WebApplicationException("User not found", 404));

		if (user.passwordHash == null || user.passwordHash.isBlank()) {
			throw new WebApplicationException("Password login is not set for this account", 409);
		}

		if (!verifyPassword(dto.password, user.passwordHash)) {
			throw new WebApplicationException("Invalid credentials", 401);
		}

		if (user.isBanned) {
			throw new WebApplicationException("User is banned", 403);
		}

		return user;
	}

	@Transactional
	public User updatePassword(Long userId, PasswordChangeDTO dto) {
		if (!dto.newPassword.equals(dto.confirmPassword)) {
			throw new WebApplicationException("Password confirmation does not match", 400);
		}

		User user = userRepository.findById(userId);
		if (user == null)
			throw new WebApplicationException("User not found", 404);

		if (user.passwordHash != null && !user.passwordHash.isBlank()) {
			if (dto.currentPassword == null || dto.currentPassword.isBlank()) {
				throw new WebApplicationException("Current password is required", 400);
			}
			if (!verifyPassword(dto.currentPassword, user.passwordHash)) {
				throw new WebApplicationException("Current password is incorrect", 401);
			}
		}

		user.passwordHash = hashPassword(dto.newPassword);
		userRepository.persist(user);
		return user;
	}

	private User syncByGoogle(UserInfo info) {
		String email = normalizeEmail(info.getString("email"));
		String rawName = info.getString("name");
		String googleId = info.getString("sub");

		LOG.debug("Syncing user by Google");

		User user = userRepository.findByGoogleId(googleId).orElse(null);
		
		if (user == null) {
			user = userRepository.findByEmail(email).orElse(null);
			if (user != null) {
				if (user.googleId == null) {
					LOG.debug("Linking Google account to existing user");
					user.googleId = googleId;
					userRepository.persist(user);
				} else {
					LOG.warn("Email already linked to different Google account");
					throw new WebApplicationException("Email already linked to different Google account", 409);
				}
			} else {
				LOG.debug("Creating new user from Google");
				user = createNewUser(email, rawName, googleId, UserRole.STUDENT);
			}
		}

		return user;
	}

	private User syncBy42(UserInfo info) {
		IntraDTO intraDTO = intraService.parseUserInfo(info);
		String normalizedEmail = normalizeEmail(intraDTO.email);

		User user = userRepository.findByIntraId(intraDTO.id.toString()).orElse(null);

		if (user == null) {
			user = userRepository.findByEmail(normalizedEmail).orElse(null);
			if (user != null) {
				if (user.intraId == null) {
					LOG.debug("Linking 42 account to existing user");
					user.intraId = intraDTO.id.toString();
					intraService.syncUserData(user, intraDTO);
				} else {
					LOG.warn("Email already linked to different 42 account");
					throw new WebApplicationException("Email already linked to different 42 account", 409);
				}
			} else {
				LOG.debug("Creating new user from 42");
				user = createNewUser(intraDTO);
			}
		}

		intraService.syncIntraData(user, intraDTO);
		return user;
	}

	public User createNewUser(String email, String rawName, String id, UserRole role) {
		LOG.debug("Creating new user (provider: google)");

		User user = new User();
		user.email = email;
		user.fullName = rawName;
		user.role = role;
		user.username = generateUsername(rawName);
		user.googleId = id;

		userRepository.persist(user);
		LOG.debug("User created successfully (provider: google)");
		return user;
	}

	public User createNewUser(IntraDTO intraDTO) {
		String normalizedEmail = normalizeEmail(intraDTO.email);
		LOG.debug("Creating new user (provider: 42)");

		User user = new User();
		user.email = normalizedEmail;
		user.intraId = intraDTO.id.toString();
		user.fullName = intraDTO.usualFullName != null ? intraDTO.usualFullName : intraDTO.displayName;
		user.username = intraDTO.login != null && !intraDTO.login.isBlank()
		? intraDTO.login : generateUsername(intraDTO.usualFullName);
		user.role = intraDTO.isStaff ? UserRole.ADMIN : UserRole.STUDENT;
		user.avatarUrl = intraDTO.image != null ? intraDTO.image.link : null;

		userRepository.persist(user);
		LOG.debug("User created successfully (provider: 42)");
		return user;
	}

	public String generateUsername(String rawName) {
		if (rawName == null || rawName.isBlank())
			rawName = "user";

		String[] parts = rawName.trim().split("\\s+");
	    String firstName = parts[0];
	    String lastName = parts[parts.length - 1];

	    firstName = firstName.toLowerCase().replaceAll("[^a-z0-9]", "");
	    lastName = lastName.toLowerCase().replaceAll("[^a-z0-9]", "");

	    if (firstName.isEmpty()) firstName = "user";
	    if (lastName.isEmpty()) lastName = firstName;

	    String candidate = null;

	    for (int n = 1; n <= firstName.length(); n++) {
	        candidate = firstName.substring(0, n) + lastName;
	        if (!userRepository.findByUsername(candidate).isPresent()) {
	            return candidate;
	        }
	    }

	    int suffix = 1;
	    final int maxSuffixAttempts = 10000;
	    while (suffix <= maxSuffixAttempts) {
	        String attempt = candidate + suffix;
	        if (!userRepository.findByUsername(attempt).isPresent()) {
	            return attempt;
	        }
	        suffix++;
	    }

	    return candidate + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
	}

	private String normalizeEmail(String email) {
		if (email == null || email.isBlank()) {
			throw new WebApplicationException("Email is required", 400);
		}
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private String sanitizeOptional(String value) {
		if (value == null) return null;
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private String hashPassword(String password) {
		return passwordService.hash(password);
	}

	private boolean verifyPassword(String rawPassword, String storedHash) {
		return passwordService.verify(rawPassword, storedHash);
	}
}
