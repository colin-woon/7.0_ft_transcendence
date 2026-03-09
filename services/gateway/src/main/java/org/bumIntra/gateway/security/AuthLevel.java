package org.bumIntra.gateway.security;

public enum AuthLevel {
	GUEST,
	USER,
	ADMIN,
	SERVICE;

	public boolean isAtLeast(AuthLevel required) {
		return this.ordinal() >= required.ordinal();
	}
}
