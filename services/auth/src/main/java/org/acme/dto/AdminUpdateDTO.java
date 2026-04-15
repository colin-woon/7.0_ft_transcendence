package org.acme.dto;

import java.util.Optional;

import org.acme.model.UserRole;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AdminUpdateDTO {
	public Optional<
		@Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
		@Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
		String> username = Optional.empty();

	public Optional<
			@Size(min = 1, max = 100, message = "Full name must be between 1 and 100 characters")
			String> fullName = Optional.empty();

	public Optional<
			@Size(max = 3000000, message = "Avatar file payload is too large")
			String> avatarFile = Optional.empty();

	public Optional<
			@Size(max = 500, message = "Bio must not exceed 500 characters")
			String> bio = Optional.empty();

	public Optional<UserRole> role = Optional.empty();
	public Optional<Boolean> isBanned = Optional.empty();
}
