package org.bumIntra.gateway.exception;

public enum GatewayErrorCode {
    // ───── Gateway / Policy errors ─────
    AUTH_REQUIRED,
    AUTH_INVALID,
    FORBIDDEN,
    RATE_LIMITED,
    SSE_ACCEPT_REQUIRED,
    PAYLOAD_TOO_LARGE,

    // ───── Service / Downstream errors ─────
    SERVICE_TIMEOUT,
    SERVICE_UNAVAILABLE,
    SERVICE_INVALID_RESPONSE,
    SERVICE_CLIENT_ERROR,
    SERVICE_SERVER_ERROR,

    // ───── Gateway internal ─────
    GATEWAY_ERROR
}
