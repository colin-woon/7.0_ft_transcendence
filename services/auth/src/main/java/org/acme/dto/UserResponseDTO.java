package org.acme.dto;

import java.time.Instant;

public class UserResponseDTO {
    // The response we send to the frontend after login or refresh, containing the access token and the user info
    public String accessToken;
    public Instant expiresIn;
    public UserInfoDTO user;

    public UserResponseDTO() {}

    public UserResponseDTO(String accessToken, Instant expiresIn, UserInfoDTO user) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }
}
