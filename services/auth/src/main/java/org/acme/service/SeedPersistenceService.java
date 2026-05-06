package org.acme.service;

import java.util.Locale;

import org.acme.dto.SeedRecordDTO;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SeedPersistenceService {

	private static final Logger LOG = Logger.getLogger(SeedPersistenceService.class);

	@Inject
	UserRepository userRepository;

	@Inject
	UserService userService;

	@Inject
	IntraService intraService;

	@Inject
	PasswordService passwordService;

	@Inject
	AvatarStorageService avatarStorageService;

	@Transactional
	public void upsertSeedUser(SeedRecordDTO record, boolean seedTest, String seedTestPassword) {
		if (record == null || record.user == null || record.user.email == null || record.user.email.isBlank()) {
			LOG.warn("Skipping invalid seed entry (missing user.email)");
			return;
		}

		String normalizedEmail = record.user.email.trim().toLowerCase(Locale.ROOT);
		String intraId = firstNonBlank(
			record.intra != null ? record.intra.intraId : null,
			record.user.intraId);
		if (intraId != null) {
			intraId = intraId.trim();
		}

		User user = null;
		if (intraId != null && !intraId.isBlank()) {
			user = userRepository.findByIntraId(intraId).orElse(null);
		}
		if (user == null) {
			user = userRepository.findByOverflowEmail(normalizedEmail).orElse(null);
		}

		String preferredUsername = firstNonBlank(record.user.username, deriveLoginFromEmail(normalizedEmail));
		String preferredFullName = firstNonBlank(record.user.fullName, preferredUsername);

		if (user == null) {
			user = new User();
			user.overflowEmail = normalizedEmail;
			user.username = ensureUniqueUsername(preferredUsername, null);
			user.fullName = preferredFullName;
			user.role = resolveRole(record.user.role, record.intra != null && record.intra.isStaff);
			user.isBanned = record.user.isBanned;
			user.intraId = intraId;
			user.bio = normalizeNullable(record.user.bio);
		} else {
			if (intraId != null && !intraId.isBlank() && (user.intraId == null || user.intraId.isBlank())) {
				user.intraId = intraId;
			}

			if (preferredUsername != null && !preferredUsername.isBlank()) {
				user.username = ensureUniqueUsername(preferredUsername, user.id);
			}
			user.fullName = preferredFullName;
			user.role = resolveRole(record.user.role, record.intra != null && record.intra.isStaff);
			user.isBanned = record.user.isBanned;
			user.bio = normalizeNullable(record.user.bio);
		}

		if (seedTest) {
			String seedPassword = normalizeSeedValue(seedTestPassword);
			if (!seedPassword.isBlank()) {
				user.passwordHash = passwordService.hash(seedPassword);
				LOG.debug("Applied SEED_TEST password to user: " + normalizedEmail + " (in-memory only, not persisted to seed_file)");
			}
		}

		if (record.intra != null) {
			String imageUrl = normalizeNullable(record.intra.imageUrl);
			if (imageUrl != null) {
				user.avatarUrl = avatarStorageService.mirrorRemoteAvatar(imageUrl, user.avatarUrl);
			}
		}

		userRepository.persist(user);

		if (record.intra != null) {
			if ((record.intra.intraId == null || record.intra.intraId.isBlank()) && user.intraId != null) {
				record.intra.intraId = user.intraId;
			}
			intraService.syncIntraData(user, record.intra);
		}
	}

	private UserRole resolveRole(String role, boolean isStaff) {
		if (role != null) {
			try {
				return UserRole.valueOf(role.trim().toUpperCase(Locale.ROOT));
			} catch (IllegalArgumentException ignored) {
				// Fall through to inferred role.
			}
		}
		return isStaff ? UserRole.ADMIN : UserRole.STUDENT;
	}

	private String ensureUniqueUsername(String requested, Long currentUserId) {
		if (requested == null || requested.isBlank()) {
			return userService.generateUsername("user");
		}

		String normalized = requested.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
		if (normalized.isBlank()) {
			normalized = "user";
		}

		User existing = userRepository.findByUsername(normalized).orElse(null);
		if (existing == null || (currentUserId != null && currentUserId.equals(existing.id))) {
			return normalized;
		}
		return userService.generateUsername(normalized);
	}

	private String normalizeNullable(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isBlank() ? null : trimmed;
	}

	private String firstNonBlank(String primary, String fallback) {
		if (primary != null && !primary.isBlank()) {
			return primary;
		}
		if (fallback != null && !fallback.isBlank()) {
			return fallback;
		}
		return null;
	}

	private String deriveLoginFromEmail(String email) {
		String localPart = email;
		int atIndex = email.indexOf('@');
		if (atIndex > 0) {
			localPart = email.substring(0, atIndex);
		}

		String candidate = localPart.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
		if (candidate.isBlank()) {
			candidate = "seedadmin";
		}

		return candidate;
	}

	private String normalizeSeedValue(String value) {
		if (value == null) {
			return "";
		}

		String trimmed = value.trim();
		if (trimmed.isBlank() || "__unset__".equalsIgnoreCase(trimmed)) {
			return "";
		}

		return trimmed;
	}
}