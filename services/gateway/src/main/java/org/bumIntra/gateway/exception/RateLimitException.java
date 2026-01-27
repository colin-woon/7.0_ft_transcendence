package org.bumIntra.gateway.exception;

import jakarta.ws.rs.core.Response;

public final class RateLimitException extends GatewayException {

	public RateLimitException() {
		super(
				Response.Status.TOO_MANY_REQUESTS,
				GatewayErrorCode.RATE_LIMITED,
				"Too many requests");
	}
}
