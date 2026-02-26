package org.acme.dto;

import java.util.Optional;

// import jakarta.validation.constraints.Size;

public class UserUpdateDTO {
    // Only these fields can be updated by the user, and all of them are optional
    // @Size(min = 3, max = 50)
    public Optional<String> username = Optional.empty();

    // @Size(min = 3, max = 50)
    public Optional<String> fullName = Optional.empty();

    public Optional<String> avatarUrl = Optional.empty();

    // @Size(max = 255)
    public Optional<String> bio = Optional.empty();
}