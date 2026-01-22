package org.bumIntra.gateway.security;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class GatewayRequestContext {

	private String _auth;
	private String _requestId;
	private String _errorCode;
	private Integer _errorStatus;

	public String getAuth() {
		return _auth;
	}

	public void setAuth(String auth) {
		_auth = auth;
	}

	public String getRequestId() {
		return _requestId;
	}

	public void setRequestId(String requestId) {
		_requestId = requestId;
	}

	public void clearError() {
		_errorCode = null;
		_errorStatus = null;
	}

	public void setError(String errorCode, Integer errorStatus) {
		_errorCode = errorCode;
		_errorStatus = errorStatus;
	}

	public String getErrorCode() {
		return _errorCode;
	}

	public Integer getErrorStatus() {
		return _errorStatus;
	}
}
