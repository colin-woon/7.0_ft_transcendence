package org.acme.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "friendships", schema = "chat_service")
public class Friendship {

    @EmbeddedId
    public FriendshipId id; //composite key

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "chat_service.friend_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    public FriendStatus status = FriendStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public Instant createdAt;
}