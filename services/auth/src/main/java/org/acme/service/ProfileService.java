package org.acme.service;

import java.util.List;
import java.util.Set;

import org.acme.dto.UserInfoDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.dto.UserUpdateDTO;
import org.acme.dto.IntraInfoDTO;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;
import org.eclipse.jdt.annotation.NonNull;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.NewCookie;

@ApplicationScoped
public class ProfileService {

	private static final Logger LOG = Logger.getLogger(ProfileService.class);

	@Inject
	UserRepository userRepository;

	@ConfigProperty(name = "secure.cookies", defaultValue = "false")
	Boolean secureCookies;

	@ConfigProperty(name = "app.domain.name", defaultValue = "localhost")
	String domain;

	public UserInfoDTO getMyInfo(Long userId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found: " + userId);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to access profile: " + user.id);
			throw new WebApplicationException("User is banned", 403);
		}

		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserInfoDTO(user, intrainfo);
	}

	@Transactional
	public UserInfoDTO updateMyInfo(Long userId, UserUpdateDTO updateDTO) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found for update: " + userId);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.isBanned) {
			LOG.warn("Banned user attempted to update profile: " + user.id);
			throw new WebApplicationException("User is banned", 403);
		}

		updateDTO.fullName.ifPresent(newValue -> user.fullName = newValue);
		updateDTO.username.ifPresent(newValue -> {
			userRepository.findByUsername(newValue).ifPresent(existing -> {
				if (!existing.id.equals(user.id))
					throw new WebApplicationException("Username already in use", 409);
			});
			user.username = newValue;
		});
		updateDTO.avatarUrl.ifPresent(newValue -> user.avatarUrl = newValue );
		updateDTO.bio.ifPresent(newValue -> user.bio = newValue );
		userRepository.persist(user);

		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserInfoDTO(user, intrainfo);
	}

	public List<@NonNull UserSummaryDTO> searchUser(String query, int page, int size, Set<String> groups) {
		if (page < 0) {
			page = 0;
		}
		if (size < 1 || size > 100) {
			size = 10;
		}
		String safeQuery = (query == null) ? "" : query.trim();

		if (groups.contains(UserRole.STUDENT.name())) {
			return userRepository.searchByName(safeQuery, page, size, UserRole.STUDENT);
		}
		return userRepository.searchByName(safeQuery, page, size);
	}

	@Transactional
	public UserInfoDTO getUserInfo(Long userId, Set<String> groups) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.debug("User not found: " + userId);
			throw new WebApplicationException("User not found", 404);
		}

		if (groups.contains(UserRole.STUDENT.name()) && user.role != UserRole.STUDENT) {
			LOG.warn("Unauthorized access attempt to user info: " + userId);
			throw new WebApplicationException("Unauthorized", 403);
		}
		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserInfoDTO(user, intrainfo);
	}

	@Transactional
	public NewCookie deleteAccount(Long userId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found for deletion: " + userId);
			throw new WebApplicationException("User not found", 404);
		}

		LOG.warn("Deleting user account: " + user.id);
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
}
