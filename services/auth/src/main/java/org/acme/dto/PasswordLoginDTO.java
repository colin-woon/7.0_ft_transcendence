package org.acme.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordLoginDTO {

	@NotBlank(message = "Email is required")
	@Email(message = "Email must be valid")
	@Size(max = 255, message = "Email must not exceed 255 characters")
	public String email;

	@NotBlank(message = "Password is required")
	@Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
	public String password;
}
