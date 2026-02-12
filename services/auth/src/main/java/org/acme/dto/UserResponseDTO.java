package org.acme.dto;

import org.acme.model.UserRole;
import java.time.Instant;

public class UserResponseDTO {
    public Long id;
    public String email;
    public String username;
    public String fullName;
    public String avatarUrl;
	public String bio;
    public UserRole role;
    public Instant createdAt;

    // empty constructor for serialization
    public UserResponseDTO() {}

    // constructor
    public UserResponseDTO(Long id, String email, String username, String fullName, String avatarUrl, String bio, UserRole role, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
		this.bio = bio;
        this.role = role;
        this.createdAt = createdAt;
    }
}