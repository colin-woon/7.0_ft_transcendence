package org.bumIntra.gateway.exception;

import java.util.HashMap;
import java.util.Map;

import jakarta.ws.rs.core.Response;

public class GatewayException extends RuntimeException {

	private final Response.Status _status;
	private final GatewayErrorCode _code;
	private final Map<String, Object> _headers = new HashMap<>();
	// TODO: add header builder in response filters to add headers from exception if
	// present

	public GatewayException(Response.Status status, GatewayErrorCode code, String message) {
		super(message);
		_status = status;
		_code = code;
	}

	public GatewayException withHeader(String key, String value) {
		_headers.put(key, value);
		return this;
	}

	public Response.Status getStatus() {
		return _status;
	}

	public GatewayErrorCode getCode() {
		return _code;
	}

	public Map<String, Object> getHeaders() {
		return _headers;
	}
}
