package org.acme.dto;

import jakarta.validation.constraints.Size;

public class UserUpdateDTO {
    
    @Size(min = 3, max = 50)
    public String fullName;

    public String avatarUrl;

    @Size(max = 255)
    public String bio;
}