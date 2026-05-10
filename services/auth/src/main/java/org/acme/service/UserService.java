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
import io.quarkus.oidc.runtime.OidcUtils;
import io.quarkus.security.identity.SecurityIdentity;
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

	@Inject
	AvatarStorageService avatarStorageService;

	@Transactional
	public User syncUser(SecurityIdentity identity, Long currentUserId) {
		UserInfo info = identity.getAttribute("userinfo");
		String tenantId = identity.getAttribute(OidcUtils.TENANT_ID_ATTRIBUTE);
		if (info == null || tenantId == null) {
			throw new WebApplicationException("auth_failed", 401);
		}

		User user = switch (tenantId) {
			case "google" -> {
				if (currentUserId == null)
					yield loginByGoogle(info);
				yield linkByGoogle(info, userRepository.findById(currentUserId));
			}

			case "42" -> {
				if (currentUserId == null)
					yield loginBy42(info);
				yield linkBy42(info, userRepository.findById(currentUserId));
			}

			default -> throw new WebApplicationException("Unsupported authentication provider", 401);
		};
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

		userRepository.findByOverflowEmail(normalizedEmail).ifPresent(existing -> {
			throw new WebApplicationException("Account already exists", 409);
		});

		userRepository.findByUsername(normalizedUsername).ifPresent(existing -> {
			throw new WebApplicationException("Username already in use", 409);
		});

		return createNewUser(dto);
	}

	@Transactional
	public User authenticateWithPassword(PasswordLoginDTO dto) {
		String normalizedEmail = normalizeEmail(dto.email);
		User user = userRepository.findByOverflowEmail(normalizedEmail).orElse(null);

		if (user == null) {
			user = findPasswordLoginFallback(normalizedEmail);
			if (user == null)
				throw new WebApplicationException("Invalid email or password", 401);
		}
		if (user.isBanned) {
			throw new WebApplicationException("User is banned", 403);
		}

		if (!passwordService.verifyWithFallback(dto.password, user.passwordHash)) {
			throw new WebApplicationException("Invalid email or password", 401);
		}

		Hibernate.initialize(user.intra);
		return user;
	}

	private User findPasswordLoginFallback(String normalizedEmail) {
		User intraEmailUser = userRepository.findByIntraEmail(normalizedEmail)
			.filter(candidate -> candidate.overflowEmail == null || candidate.overflowEmail.isBlank())
			.orElse(null);
		if (intraEmailUser != null) {
			return intraEmailUser;
		}

		return userRepository.findByGoogleEmail(normalizedEmail)
			.filter(candidate -> candidate.overflowEmail == null || candidate.overflowEmail.isBlank())
			.orElse(null);
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
			if (!passwordService.verify(dto.currentPassword, user.passwordHash)) {
				throw new WebApplicationException("Current password is incorrect", 400);
			}
		}

		user.passwordHash = passwordService.hash(dto.newPassword);
		userRepository.persist(user);
		Hibernate.initialize(user.intra);
		return user;
	}

	private User loginByGoogle(UserInfo info) {
		String email = normalizeEmail(info.getString("email"));
		String rawName = info.getString("name");
		String googleId = info.getString("sub");

		User user = userRepository.findByGoogleId(googleId).orElse(null);
		if (user != null) {
			User byGoogleEmail = userRepository.findByGoogleEmail(email).orElse(null);
			if (byGoogleEmail != null && !byGoogleEmail.id.equals(user.id)) {
				LOG.warn("Google account id and email map to different local users");
				throw new WebApplicationException("Google account identity conflict", 409);
			}
			if (user.googleEmail == null || user.googleEmail.isBlank()) {
				user.googleEmail = email;
				userRepository.persist(user);
			}
			return user;
		}

		user = userRepository.findByGoogleEmail(email).orElse(null);
		if (user != null) {
			if (user.googleId == null) {
				LOG.debug("Linking Google id to existing user via googleEmail");
				user.googleId = googleId;
			} else if (!user.googleId.equals(googleId)) {
				LOG.warn("Google email already linked to different Google account");
			throw new WebApplicationException("auth_conflict", 409);
			}

			user.googleEmail = email;
			userRepository.persist(user);
			return user;
		}

		return createNewUser(email, rawName, googleId, UserRole.STUDENT);
	}

	private User linkByGoogle(UserInfo info, User targetUser) {
		String email = normalizeEmail(info.getString("email"));
		String googleId = info.getString("sub");

		User byGoogleId = userRepository.findByGoogleId(googleId).orElse(null);
		if (byGoogleId != null && !byGoogleId.id.equals(targetUser.id)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		User byGoogleEmail = userRepository.findByGoogleEmail(email).orElse(null);
		if (byGoogleEmail != null && !byGoogleEmail.id.equals(targetUser.id)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		if (targetUser.googleId != null && !targetUser.googleId.equals(googleId)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		targetUser.googleId = googleId;
		targetUser.googleEmail = email;
		userRepository.persist(targetUser);
		return targetUser;
	}

	private User loginBy42(UserInfo info) {
		IntraDTO intraDTO = intraService.parseUserInfo(info);
		String intraEmail = normalizeEmail(intraDTO.email);
		String intraId = intraDTO.id.toString();

		User user = userRepository.findByIntraId(intraId).orElse(null);
		if (user != null) {
			User byIntraEmail = userRepository.findByIntraEmail(intraEmail).orElse(null);
			if (byIntraEmail != null && !byIntraEmail.id.equals(user.id)) {
				LOG.warn("42 account id and email map to different local users");
				throw new WebApplicationException("auth_conflict", 409);
			}
			intraService.syncUserData(user, intraDTO, intraEmail);
			intraService.syncIntraData(user, intraDTO);
			return user;
		}

		user = userRepository.findByIntraEmail(intraEmail).orElse(null);
		if (user != null) {
			if (user.intraId == null) {
				LOG.debug("Linking 42 id to existing user via intraEmail");
				user.intraId = intraId;
			} else if (!user.intraId.equals(intraId)) {
				LOG.warn("42 email already linked to different 42 account");
			throw new WebApplicationException("auth_conflict", 409);
			}
			intraService.syncUserData(user, intraDTO, intraEmail);
			intraService.syncIntraData(user, intraDTO);
			return user;
		}

		user = createNewUser(intraDTO);
		intraService.syncIntraData(user, intraDTO);
		return user;
	}

	private User linkBy42(UserInfo info, User targetUser) {
		IntraDTO intraDTO = intraService.parseUserInfo(info);
		String intraEmail = normalizeEmail(intraDTO.email);
		String intraId = intraDTO.id.toString();

		User byIntraId = userRepository.findByIntraId(intraId).orElse(null);
		if (byIntraId != null && !byIntraId.id.equals(targetUser.id)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		User byIntraEmail = userRepository.findByIntraEmail(intraEmail).orElse(null);
		if (byIntraEmail != null && !byIntraEmail.id.equals(targetUser.id)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		if (targetUser.intraId != null && !targetUser.intraId.equals(intraId)) {
			throw new WebApplicationException("link_conflict", 409);
		}

		targetUser.intraId = intraId;
		targetUser.intraEmail = intraEmail;
		userRepository.persist(targetUser);

		intraService.syncIntraData(targetUser, intraDTO);
		return targetUser;
	}

	public User createNewUser(String email, String rawName, String id, UserRole role) {
		User user = new User();
		user.googleEmail = email;
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

		User user = new User();
		user.intraEmail = normalizedEmail;
		user.intraId = intraDTO.id.toString();
		user.fullName = intraDTO.usualFullName != null ? intraDTO.usualFullName : intraDTO.displayName;
		user.username = intraDTO.login != null && !intraDTO.login.isBlank()
		? intraDTO.login : generateUsername(intraDTO.usualFullName);
		user.role = intraDTO.isStaff ? UserRole.ADMIN : UserRole.STUDENT;
		user.avatarUrl = intraDTO.image != null
			? avatarStorageService.mirrorRemoteAvatar(intraDTO.image.link, null)
			: null;

		userRepository.persist(user);
		LOG.debug("User created successfully (provider: 42)");
		return user;
	}

	public User createNewUser(PasswordRegisterDTO dto) {
		String normalizedEmail = normalizeEmail(dto.email);
		String normalizedUsername = dto.username.trim();

		User user = new User();
		user.overflowEmail = normalizedEmail;
		user.username = normalizedUsername;
		user.fullName = dto.fullName.trim();
		user.avatarUrl = avatarStorageService.replaceManagedAvatar(dto.avatarFile, null);
		user.bio = dto.bio;
		user.role = UserRole.STUDENT;
		user.passwordHash = passwordService.hash(dto.password);

		userRepository.persist(user);
		LOG.debug("User created successfully (provider: Overflow)");
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
}
