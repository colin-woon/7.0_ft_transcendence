package org.bumIntra.gateway.exception;

import jakarta.ws.rs.core.Response;

public abstract class GatewayException extends RuntimeException {

	private final Response.Status _status;
	private final String _code;

	protected GatewayException(Response.Status status, String code, String message) {
		super(message);
		_status = status;
		_code = code;
	}

	public Response.Status getStatus() {
		return _status;
	}

	public String getCode() {
		return _code;
	}
}
