package org.bumIntra.gateway.exception;

public enum GatewayErrorCode {
	// ───── Gateway / Policy errors ─────
	AUTH_REQUIRED,
	AUTH_INVALID,
	FORBIDDEN,
	RATE_LIMITED,

	// ───── Service / Downstream errors ─────
	SERVICE_TIMEOUT,
	SERVICE_UNAVAILABLE,
	SERVICE_INVALID_RESPONSE,
	SERVICE_CLIENT_ERROR,
	SERVICE_SERVER_ERROR,

	// ───── Gateway internal (rare) ─────
	GATEWAY_ERROR
}
