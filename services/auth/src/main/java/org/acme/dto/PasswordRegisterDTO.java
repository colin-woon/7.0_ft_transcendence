package org.acme.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PasswordRegisterDTO {

	@NotBlank(message = "Email is required")
	@Email(message = "Email must be valid")
	@Size(max = 255, message = "Email must not exceed 255 characters")
	public String email;

	@NotBlank(message = "Username is required")
	@Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
	@Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
	public String username;

	@NotBlank(message = "Full name is required")
	@Size(min = 1, max = 100, message = "Full name must be between 1 and 100 characters")
	public String fullName;

	@Pattern(regexp = "^(https?://\\S+)?$", message = "Avatar URL must be a valid URL")
	@Size(max = 500, message = "Avatar URL must not exceed 500 characters")
	public String avatarUrl;

	@Size(max = 500, message = "Bio must not exceed 500 characters")
	public String bio;

	@NotBlank(message = "Password is required")
	@Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
	@Pattern(
		regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$",
		message = "Password must include uppercase, lowercase, number, and symbol"
	)
	public String password;

	@NotBlank(message = "Password confirmation is required")
	@Size(min = 8, max = 128, message = "Password confirmation must be between 8 and 128 characters")
	@Pattern(
		regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$",
		message = "Password confirmation must include uppercase, lowercase, number, and symbol"
	)
	public String confirmPassword;
}
