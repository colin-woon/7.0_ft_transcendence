package org.acme.dto;

import java.time.Instant;

public class SessionDTO {
	public String sessionId;
	public String deviceType;
	public String browser;
	public String os;
	public String ipAddress;
	public Instant expiresAt;
	public Instant createdAt;

	public SessionDTO() {}

	public SessionDTO(String sessionId, String deviceType, String browser,
			String os, String ipAddress, Instant expiresAt, Instant createdAt) {
		this.sessionId = sessionId;
		this.deviceType = deviceType;
		this.browser = browser;
		this.os = os;
		this.ipAddress = ipAddress;
		this.expiresAt = expiresAt;
		this.createdAt = createdAt;
	}
}
