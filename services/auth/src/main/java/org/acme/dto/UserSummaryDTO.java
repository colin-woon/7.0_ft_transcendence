package org.acme.dto;

public class UserSummaryDTO {
    public Long id;
    public String username;
    public String fullName;
    public String avatarUrl;

    // empty constructor for serialization
    public UserSummaryDTO() {}

    // constructor
    public UserSummaryDTO(Long id, String username, String fullName, String avatarUrl) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
    }
}