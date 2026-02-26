package org.acme.service;

import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;
import org.jboss.logging.Logger;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class UserService {
	
	private static final Logger LOG = Logger.getLogger(UserService.class);
	
	@Inject
	UserRepository userRepository;

	@Transactional
	public User syncUser(UserInfo info, String tenantId) {
		LOG.debug("Syncing user from tenant: " + tenantId);
		return switch (tenantId) {
			case "google" -> augmentByGoogle(info);

			case "42" -> augmentBy42(info);

			default -> {
				LOG.error("Unknown tenant: " + tenantId);
				yield null;
			}
		};
	}

	private User augmentByGoogle(UserInfo info) {
		String email = info.getString("email");
		String rawName = info.getString("name");
		String googleId = info.getString("sub");

		LOG.debug("Augmenting user by Google: " + email);

		User user = userRepository.findByGoogleId(googleId).orElse(null);
		
		if (user == null) {
			user = userRepository.findByEmail(email).orElse(null);
			if (user != null) {
				if (user.googleId == null) {
					LOG.info("Linking Google account to existing user: " + email);
					user.googleId = googleId;
					userRepository.persist(user);
				} else {
					LOG.error("Email already linked to different Google account: " + email);
					throw new RuntimeException("Email already linked to different Google account");
				}
			} else {
				LOG.info("Creating new user from Google: " + email);
				user = createNewUser(email, rawName, googleId, UserRole.STUDENT, "google");
			}
		}

		return user;
	}

	private User augmentBy42(UserInfo info) {
		String email = info.getString("email");
		String rawName = info.getString("login");
		String intraId = info.getString("id");
		UserRole role;

		LOG.debug("Augmenting user by 42: " + email);

		if ((info.contains("kind") && info.getString("kind").equals("admin"))
				|| (email != null && email.endsWith("@staff.42.fr"))) {
			role = UserRole.ADMIN;
		} else {
			role = UserRole.STUDENT;
		}

		User user = userRepository.findByIntraId(intraId).orElse(null);
		
		if (user == null) {
			user = userRepository.findByEmail(email).orElse(null);
			if (user != null) {
				if (user.intraId == null) {
					LOG.info("Linking 42 account to existing user: " + email);
					user.intraId = intraId;
					if (role == UserRole.ADMIN) {
						user.role = UserRole.ADMIN;
					}
					userRepository.persist(user);
				} else {
					LOG.error("Email already linked to different 42 account: " + email);
					throw new RuntimeException("Email already linked to different 42 account");
				}
			} else {
				LOG.info("Creating new user from 42: " + email);
				user = createNewUser(email, rawName, intraId, role, "42");
			}
		}
	
		return user;
	}

	private User createNewUser(String email, String rawName, String id, UserRole role, String provider) {
		LOG.info("Creating new user: " + email + " (provider: " + provider + ")");
		User user = new User();
		user.email = email;
		user.fullName = rawName;
		user.role = role;
		user.username = generateUsername(rawName);

		if (provider.equals("google")) {
			user.googleId = id;
		} else if (provider.equals("42")) {
			user.intraId = id;
		}
		userRepository.persist(user);
		LOG.info("User created successfully with username: " + user.username);
		return user;
	}

	private String generateUsername(String rawName) {
		if (rawName == null || rawName.isBlank())
            rawName = "user";

        String baseUsername = rawName.toLowerCase()
            .replaceAll("[^a-z0-9]", "")
            .substring(0, Math.min(rawName.length(), 20));

        if (baseUsername.isEmpty())
            baseUsername = "user";
        
        String username = baseUsername;
        int maxAttempts = 100;
        int attempt = 1;

        while (attempt <= maxAttempts) {
            if (!userRepository.findByUsername(username).isPresent()) {
                return username;
            }
            username = baseUsername + attempt;
            attempt++;
        }
        
        return baseUsername + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
	}
}
