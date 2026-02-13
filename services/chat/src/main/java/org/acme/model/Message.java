package org.acme.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "messages", schema = "chat_service")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "sender_id", nullable = false)
    public Integer senderId;

    @Column(name = "receiver_id", nullable = false)
    public Integer receiverId;

    @Column(columnDefinition = "TEXT", nullable = false)
    public String content;

    @Column(name = "is_read")
    public boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public Instant createdAt;
}