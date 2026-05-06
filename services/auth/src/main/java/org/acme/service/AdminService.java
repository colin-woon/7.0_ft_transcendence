package org.acme.service;

import org.acme.dto.AdminUpdateDTO;
import org.acme.dto.IntraInfoDTO;
import org.acme.dto.UserInfoDTO;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.SessionRepository;
import org.acme.repository.UserRepository;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class AdminService {

	private static final Logger LOG = Logger.getLogger(AdminService.class);

	@Inject
	UserRepository userRepository;

	@Inject
	SessionRepository sessionRepository;

	@Inject
	AvatarStorageService avatarStorageService;

	@Transactional
	public UserInfoDTO adminUpdateUser(Long userId, Long adminId, AdminUpdateDTO updateDTO) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found for admin update: " + userId);
			throw new WebApplicationException("User not found", 404);
		}

		if (user.role == UserRole.ADMIN && !userId.equals(adminId)) {
			LOG.warn("Attempt to modify another admin user: " + userId);
			throw new WebApplicationException("Cannot modify another admin user", 403);
		}

		updateDTO.fullName.ifPresent(newValue -> user.fullName = newValue);
		updateDTO.username.ifPresent(newValue -> {
			userRepository.findByUsername(newValue).ifPresent(existing -> {
				if (!existing.id.equals(user.id))
					throw new WebApplicationException("Username already in use", 409);
			});
			user.username = newValue;
		});
		updateDTO.avatarFile.ifPresent(newValue -> {
			user.avatarUrl = avatarStorageService.replaceManagedAvatar(newValue, user.avatarUrl);
		});
		updateDTO.bio.ifPresent(newValue -> user.bio = newValue );
		updateDTO.role.ifPresent(newValue -> user.role = newValue);
		updateDTO.isBanned.ifPresent(newValue -> user.isBanned = newValue);
		userRepository.persist(user);

		IntraInfoDTO intrainfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return avatarStorageService.toUserInfoDTO(user, intrainfo);
	}

	@Transactional
	public void adminLogoutUser(Long userId, Long adminId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found for admin logout: " + userId);
			throw new WebApplicationException("User not found", 404);
		}
		if (user.role == UserRole.ADMIN && !userId.equals(adminId)) {
			LOG.warn("Attempt to logout another admin user: " + userId);
			throw new WebApplicationException("Cannot logout another admin user", 403);
		}

		sessionRepository.deleteByUserId(userId);
		LOG.info("Admin logged out user: " + userId);
	}

	@Transactional
	public void adminDeleteAccount(Long userId, Long adminId) {
		User user = userRepository.findById(userId);
		if (user == null) {
			LOG.error("User not found for deletion: " + userId);
			throw new WebApplicationException("User not found", 404);
		}

		if (user.role == UserRole.ADMIN && !userId.equals(adminId)) {
			LOG.warn("Attempt to delete another admin user: " + userId);
			throw new WebApplicationException("Cannot delete another admin user", 403);
		}

		LOG.warn("Deleting user account: " + user.id);
		avatarStorageService.deleteManagedAvatar(user.avatarUrl);
		userRepository.delete(user);
	}

	@Transactional
	public UserInfoDTO adminCreateUser(UserInfoDTO userInfo) {
		userRepository.findByOverflowEmail(userInfo.overflowEmail).ifPresent(email -> {
			LOG.warn("Attempt to create user with existing email: " + userInfo.overflowEmail);
			throw new WebApplicationException("Email already in use", 409);
		});

		userRepository.findByUsername(userInfo.username).ifPresent(username -> {
			LOG.warn("Attempt to create user with existing username: " + userInfo.username);
			throw new WebApplicationException("Username already in use", 409);
		});

		User newUser = new User();
		newUser.overflowEmail = userInfo.overflowEmail;
		newUser.username = userInfo.username;
		newUser.fullName = userInfo.fullName;
		newUser.avatarUrl = avatarStorageService.replaceManagedAvatar(userInfo.avatarFile, null);
		newUser.bio = userInfo.bio;
		newUser.role = userInfo.role;
		newUser.isBanned = userInfo.isBanned;
		userRepository.persist(newUser);
	
		LOG.info("Admin created new user: " + newUser.id);
		return avatarStorageService.toUserInfoDTO(newUser, null);
	}
}
