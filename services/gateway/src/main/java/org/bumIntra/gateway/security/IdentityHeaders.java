package org.bumIntra.gateway.security;

public final class IdentityHeaders {

	private IdentityHeaders() {
	}

	public static final String REQUEST_ID = "X-Intra-Request-Id";
	public static final String AUTH_LEVEL = "X-Intra-Auth-Level";
	public static final String USER_ID = "X-Intra-User-Id";
	public static final String USER_ROLES = "X-Intra-User-Roles";
	public static final String SERVICE_ID = "X-Intra-Service-Id";
	public static final String INTERNAL_REQUEST = "X-Intra-Internal-Request";
	public static final String INTRA_REAL_IP = "X-Intra-Real-Ip";
	public static final String INTRA_FORWARDED_FOR = "X-Intra-Forwarded-For";
	public static final String INTRA_FORWARDED_HOST = "X-Intra-Forwarded-Host";
	public static final String INTRA_FORWARDED_PROTO = "X-Intra-Forwarded-Proto";
	public static final String CLIENT_IP = "X-Intra-Client-Ip";

	public static final String REAL_IP = "X-Real-Ip";
	public static final String FORWARDED_FOR = "X-Forwarded-For";
	public static final String FORWARDED_HOST = "X-Forwarded-Host";
	public static final String FORWARDED_PROTO = "X-Forwarded-Proto";
}
