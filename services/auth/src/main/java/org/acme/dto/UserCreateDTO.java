package org.acme.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserCreateDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    public String email;

    @NotBlank(message = "Username is required")
    public String username;

    public String fullName;
    public String intraId;
    public String googleId;
    public String avatarUrl;
}