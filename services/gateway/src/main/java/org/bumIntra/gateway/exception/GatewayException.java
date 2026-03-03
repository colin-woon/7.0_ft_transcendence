package org.bumIntra.gateway.exception;

import jakarta.ws.rs.core.Response;

public class GatewayException extends RuntimeException {

	private final Response.Status _status;
	private final GatewayErrorCode _code;

	public GatewayException(Response.Status status, GatewayErrorCode code, String message) {
		super(message);
		_status = status;
		_code = code;
	}

	public Response.Status getStatus() {
		return _status;
	}

	public GatewayErrorCode getCode() {
		return _code;
	}
}
