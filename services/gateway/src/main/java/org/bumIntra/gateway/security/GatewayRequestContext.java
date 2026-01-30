package org.bumIntra.gateway.security;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class GatewayRequestContext {

	private String _auth;
	private String _requestId;
	private String _errorCode;
	private Integer _errorStatus;
	private String _clientIp;
	private boolean _internal;
	private String _userId;
	private List<String> _roles;
	private AuthLevel _authLevel = AuthLevel.GUEST;

	public String getAuth() {
		return _auth;
	}

	public boolean isAuth() {
		return getAuth() != null && !getAuth().isBlank();
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

	public void setClientIp(String clientIp) {
		_clientIp = clientIp;
	}

	public String getClientIp() {
		return _clientIp;
	}

	public void setInternal(boolean internal) {
		_internal = internal;
	}

	public boolean isInternal() {
		return _internal;
	}

	public String getRateLimitKey() {
		if (isAuth()) {
			return getAuth();
		}
		return getClientIp();
	}

	public Optional<String> getUserId() {
		return Optional.ofNullable(_userId);
	}

	public void setUserId(String userId) {
		_userId = userId;
	}

	public Optional<List<String>> getRoles() {
		return Optional.ofNullable(_roles);
	}

	public void setRoles(List<String> roles) {
		_roles = roles;
	}

	public AuthLevel setAuthLevel(AuthLevel authLevel) {
		return _authLevel = authLevel;
	}

	public AuthLevel getAuthLevel() {
		return _authLevel;
	}
}
