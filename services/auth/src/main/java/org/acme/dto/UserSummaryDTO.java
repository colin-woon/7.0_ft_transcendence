package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class UserSummaryDTO {
    // Basic information about the user, for dropdown menus and other places where we don't need all the details
    public Long id;
    public String username;
    public String fullName;
    public String avatarImage;
    @JsonIgnore
    public String avatarPath;

    public UserSummaryDTO() {}

    public UserSummaryDTO(Long id, String username, String fullName, String avatarUrl) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.avatarPath = avatarUrl;
    }
}
