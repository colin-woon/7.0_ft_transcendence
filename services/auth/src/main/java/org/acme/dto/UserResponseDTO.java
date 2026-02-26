package org.acme.dto;

public class UserResponseDTO {
    // The response we send to the frontend after login or refresh, containing the access token and the user info
    public String accessToken;
    public Long expiresIn;
    public UserInfoDTO user;

    public UserResponseDTO() {}

    public UserResponseDTO(String accessToken, Long expiresIn, UserInfoDTO user) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }
}
