package org.bumIntra.gateway.exception;

import java.time.Instant;

public class GatewayErrorResponse {

	public Instant timestamp;
	public int status;
	public String error;
	public GatewayErrorCode code;
	public String message;
	public String requestId;

	public GatewayErrorResponse() {
	}

	public GatewayErrorResponse(int status, String error, GatewayErrorCode code, String message, String requestId) {
		this.timestamp = Instant.now();
		this.status = status;
		this.error = error;
		this.code = code;
		this.message = message;
		this.requestId = requestId;
	}
}
