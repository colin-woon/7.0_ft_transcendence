package org.acme.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sessions", schema = "auth_service")
public class Session {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long id;

	@Column(name = "session_id", nullable = false, unique = true)
	public String sessionId;

	@Column(name = "user_id", nullable = false)
	public Long userId;

	@Column(name = "device_type")
	public String deviceType;

	public String browser;

	public String os;

	@Column(name = "ip_address")
	public String ipAddress;

	@Column(name = "expires_at", nullable = false)
	public Instant expiresAt;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	public Instant createdAt;
}
