package org.acme.dto;

import java.time.Instant;

import org.acme.model.User;
import org.acme.model.UserRole;

public class UserInfoDTO {
	// All the information about the user that we want to expose to the frontend.
	public Long id;
	public String username;
	public String fullName;
	public String avatarUrl;
	public String bio;
	public String email;
	public UserRole role;
	public boolean isBanned;
	public Instant lastSeenAt;
	public Instant updatedAt;
	public Instant createdAt;

	public boolean linkedWithGoogle;
	public boolean linkedWithIntra;
	public boolean hasPassword;

	public IntraInfoDTO intraInfo;

	public UserInfoDTO() {}

	public UserInfoDTO(Long id, String username, String fullName, String avatarUrl, String bio, String email,
			UserRole role, boolean isBanned, Instant lastSeenAt, Instant createdAt, boolean linkedWithGoogle,
			Instant updatedAt, boolean linkedWithIntra, boolean hasPassword, IntraInfoDTO intraInfo) {
		this.id = id;
		this.username = username;
		this.fullName = fullName;
		this.avatarUrl = avatarUrl;
		this.bio = bio;
		this.email = email;
		this.role = role;
		this.isBanned = isBanned;
		this.lastSeenAt = lastSeenAt;
		this.updatedAt = updatedAt;
		this.createdAt = createdAt;
		this.linkedWithGoogle = linkedWithGoogle;
		this.linkedWithIntra = linkedWithIntra;
		this.hasPassword = hasPassword;
		this.intraInfo = intraInfo;
	}

	public UserInfoDTO(User user, IntraInfoDTO intraInfo) {
		this.id = user.id;
		this.username = user.username;
		this.fullName = user.fullName;
		this.avatarUrl = user.avatarUrl;
		this.bio = user.bio;
		this.email = user.email;
		this.role = user.role;
		this.isBanned = user.isBanned;
		this.lastSeenAt = user.lastSeenAt;
		this.updatedAt = user.updatedAt;
		this.createdAt = user.createdAt;
		this.linkedWithGoogle = user.googleId != null;
		this.linkedWithIntra = user.intraId != null;
		this.hasPassword = user.passwordHash != null && !user.passwordHash.isBlank();
		this.intraInfo = intraInfo;
	}
}
