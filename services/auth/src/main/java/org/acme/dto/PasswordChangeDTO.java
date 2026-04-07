package org.acme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PasswordChangeDTO {

	@Size(min = 8, max = 128, message = "Current password must be between 8 and 128 characters")
	public String currentPassword;

	@NotBlank(message = "New password is required")
	@Size(min = 8, max = 128, message = "New password must be between 8 and 128 characters")
	@Pattern(
		regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$",
		message = "New password must include uppercase, lowercase, number, and symbol"
	)
	public String newPassword;

	@NotBlank(message = "Password confirmation is required")
	@Size(min = 8, max = 128, message = "Password confirmation must be between 8 and 128 characters")
	@Pattern(
		regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$",
		message = "Password confirmation must include uppercase, lowercase, number, and symbol"
	)
	public String confirmPassword;
}
