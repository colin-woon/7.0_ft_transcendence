package org.acme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class MessageDTO {
    public Long id;

    @NotNull
    public Integer senderId;

    @NotNull
    public Integer receiverId;

    @NotBlank
    public String content;

    public Instant createdAt;

    // Constructors
    public MessageDTO() {}
    public MessageDTO(Long id, Integer senderId, Integer receiverId, String content, Instant createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.createdAt = createdAt;
    }
}