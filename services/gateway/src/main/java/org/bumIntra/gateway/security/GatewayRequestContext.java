package org.bumIntra.gateway.security;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class GatewayRequestContext {

	private String _auth;
	private String _requestId;

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
}
