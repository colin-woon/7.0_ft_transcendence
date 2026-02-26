package org.acme.service;

import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class UserService {
	@Inject
	UserRepository userRepository;

	@Transactional
	public User syncUser(UserInfo info, String tenantId) {
		System.out.println("Hit the UserService");
		return switch (tenantId) {
			case "google" -> augmentByGoogle(info);

			case "42" -> augmentBy42(info);

			default -> null;
		};
	}

	private User augmentByGoogle(UserInfo info) {
		String email = info.getString("email");
		String rawName = info.getString("name");
		String googleId = info.getString("sub");

		User user = userRepository.findByGoogleId(googleId)
				.orElseGet(() -> {
					return userRepository.findByEmail(email)
							.orElseGet(() -> {
								return userRepository.findByFullName(rawName)
									.orElseGet(() -> createNewUser(email, rawName, googleId, UserRole.STUDENT, "google"));
							});
				});

		return user;
	}

	private User augmentBy42(UserInfo info) {
		String email = info.getString("email");
		String rawName = info.getString("login");
		String intraId = info.getString("id");
		UserRole role;

		if ((info.contains("kind") && info.getString("kind").equals("admin"))
				|| (email != null && email.endsWith("@staff.42.fr"))) {
			role = UserRole.ADMIN;
		} else {
			role = UserRole.STUDENT;
		}

		User user = userRepository.findByIntraId(intraId)
				.orElseGet(() -> {
					return userRepository.findByEmail(email)
							.orElseGet(() -> {
								return userRepository.findByFullName(rawName)
									.orElseGet(() -> createNewUser(email, rawName, intraId, role, "42"));
							});
				});
	
		return user;
	}

	private User createNewUser(String email, String rawName, String id, UserRole role, String provider) {
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
		return user;
	}

	// Should update this into an actual generation technique in the future, but for now this is good enough
	private String generateUsername(String rawName) {
		if (rawName == null || rawName.isBlank())
            rawName = "user";
        String baseUsername = rawName.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (baseUsername.isEmpty())
            baseUsername = "user";
        String username = baseUsername;
        int suffix = 1;

        while (userRepository.findByUsername(username).isPresent()) {
            username = baseUsername + suffix;
            suffix++;
        }
        return username;
	}
}
