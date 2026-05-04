package org.acme.dto;

import java.util.Optional;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserUpdateDTO {

	public Optional<
			@Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
			@Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
			String> username = Optional.empty();

	public Optional<
			@Size(min = 1, max = 100, message = "Full name must be between 1 and 100 characters")
			String> fullName = Optional.empty();

	public Optional<
			String> avatarFile = Optional.empty();

	public Optional<
			@Size(max = 500, message = "Bio must not exceed 500 characters")
			String> bio = Optional.empty();
}
