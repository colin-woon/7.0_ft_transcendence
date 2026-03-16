package org.acme.service;

import org.acme.dto.IntraDTO;
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

	@Transactional
	public User syncUser(UserInfo info, String tenantId) {
		LOG.debug("Syncing user from tenant: " + tenantId);
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

	private User syncByGoogle(UserInfo info) {
		String email = info.getString("email");
		String rawName = info.getString("name");
		String googleId = info.getString("sub");

		LOG.debug("Syncing user by Google: " + email);

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
					throw new WebApplicationException("Email already linked to different Google account", 409);
				}
			} else {
				LOG.info("Creating new user from Google: " + email);
				user = createNewUser(email, rawName, googleId, UserRole.STUDENT);
			}
		}

		return user;
	}

	private User syncBy42(UserInfo info) {
		IntraDTO intraDTO = intraService.parseUserInfo(info);

		User user = userRepository.findByIntraId(intraDTO.id.toString()).orElse(null);

		if (user == null) {
			user = userRepository.findByEmail(intraDTO.email).orElse(null);
			if (user != null) {
				if (user.intraId == null) {
					LOG.info("Linking 42 account to existing user: " + intraDTO.email);
					user.intraId = intraDTO.id.toString();
					intraService.syncUserData(user, intraDTO);
				} else {
					LOG.error("Email already linked to different 42 account: " + intraDTO.email);
					throw new WebApplicationException("Email already linked to different 42 account", 409);
				}
			} else {
				LOG.info("Creating new user from 42: " + intraDTO.email);
				user = createNewUser(intraDTO);
			}
		}

		intraService.syncIntraData(user, intraDTO);
		return user;
	}

	public User createNewUser(String email, String rawName, String id, UserRole role) {
		LOG.info("Creating new user: " + email + " (provider: google)");

		User user = new User();
		user.email = email;
		user.fullName = rawName;
		user.role = role;
		user.username = generateUsername(rawName);
		user.googleId = id;

		userRepository.persist(user);
		LOG.info("User created successfully with username: " + user.username);
		return user;
	}

	public User createNewUser(IntraDTO intraDTO) {
		LOG.info("Creating new user: " + intraDTO.email + " (provider: 42)");

		User user = new User();
		user.email = intraDTO.email;
		user.intraId = intraDTO.id.toString();
		user.fullName = intraDTO.usualFullName != null ? intraDTO.usualFullName : intraDTO.displayName;
		user.username = intraDTO.login != null && !intraDTO.login.isBlank()
		? intraDTO.login : generateUsername(intraDTO.usualFullName);
		user.role = intraDTO.isStaff ? UserRole.ADMIN : UserRole.STUDENT;
		user.avatarUrl = intraDTO.image != null ? intraDTO.image.link : null;

		userRepository.persist(user);
		LOG.info("User created successfully with username: " + user.username);
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
}
