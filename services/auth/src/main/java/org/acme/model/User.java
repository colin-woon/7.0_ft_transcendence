package org.acme.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users", schema = "auth_service")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    // --- Identity Providers ---
    @Column(name = "overflow_email", unique = true)
    public String overflowEmail;

    @Column(name = "google_email", unique = true)
    public String googleEmail;

    @Column(name = "intra_email", unique = true)
    public String intraEmail;

    @Column(name = "intra_id", unique = true)
    public String intraId;

    @Column(name = "google_id", unique = true)
    public String googleId;

    @Column(name = "password_hash")
    public String passwordHash;

    // --- Profile Data ---
    @Column(nullable = false, unique = true)
    public String username;

    @Column(name = "full_name")
    public String fullName;

    @Column(name = "avatar_url")
    public String avatarUrl;

    public String bio;

    // --- Security & Status ---
    @Enumerated(EnumType.STRING) // maps java enum to postgres enum
    @Column(columnDefinition = "auth_service.user_role")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
	public UserRole role = UserRole.STUDENT;

    @Column(name = "is_banned")
    public boolean isBanned = false;

    @Column(name = "last_seen_at")
    public Instant lastSeenAt;

    // --- Timestamps ---
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public Instant updatedAt;

    // --- Intra relationship (1:1, owned by Intra side) ---
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public Intra intra;
}
