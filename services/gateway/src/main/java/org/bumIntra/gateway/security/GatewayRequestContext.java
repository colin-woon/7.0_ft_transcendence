package org.bumIntra.gateway.security;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;

@RequestScoped
public class GatewayRequestContext {

    // RequestContextFilter
    private Instant _st;
    private String _auth;
    private String _requestId;
    private String _errorCode;
    private Integer _errorStatus;
    private String _clientIp;
    private boolean _internal;
    private String _userId;
    private String _path;
    private String _pathType;
    private MultivaluedMap<String, String> _queryParams;
    private MultivaluedMap<String, String> _headers;
    private String _realIp;
    private String _forwardedFor;
    private String _forwardedHost;
    private String _forwardedProto;
    private String _serviceName;

    // ServiceAuthFilter
    private Set<String> _roles = Collections.emptySet();
    private AuthLevel _authLevel = AuthLevel.GUEST;
    private boolean _isPublic;

    // SSE
    private boolean _isSse;

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
        if (getAuthLevel() == AuthLevel.SERVICE) {
            return "internal:" + getServiceName();
        }
        if (getAuthLevel() != AuthLevel.GUEST && getUserId().isPresent()) {
            return "user:" + getUserId().get();
        }
        return "ip:" + getClientIp();
    }

    public Optional<String> getUserId() {
        return Optional.ofNullable(_userId);
    }

    public void setUserId(String userId) {
        _userId = userId;
    }

    public Set<String> getRoles() {
        return _roles;
    }

    public void setRoles(Set<String> roles) {
        _roles = roles;
    }

    public AuthLevel setAuthLevel(AuthLevel authLevel) {
        return _authLevel = authLevel;
    }

    public AuthLevel getAuthLevel() {
        return _authLevel;
    }

    public boolean isPublic() {
        return _isPublic;
    }

    public void setPublic(boolean isPublic) {
        _isPublic = isPublic;
    }

    public String getPath() {
        return _path;
    }

    public void setPath(String path) {
        String p = path.trim().toLowerCase().replaceAll("/+", "/");
        _path = p.startsWith("/") ? p : "/" + p;
    }

    public void setRealIp(String realIp) {
        _realIp = realIp;
    }

    public String getRealIp() {
        return _realIp;
    }

    public void setForwardedFor(String forwardedFor) {
        _forwardedFor = forwardedFor;
    }

    public String getForwardedFor() {
        return _forwardedFor;
    }

    public void setForwardedHost(String forwardedHost) {
        _forwardedHost = forwardedHost;
    }

    public String getForwardedHost() {
        return _forwardedHost;
    }

    public void setForwardedProto(String forwardedProto) {
        _forwardedProto = forwardedProto;
    }

    public String getForwardedProto() {
        return _forwardedProto;
    }

    public MultivaluedMap<String, String> getQueryParams() {
        return _queryParams != null ? _queryParams : new MultivaluedHashMap<>();
    }

    public void setQueryParams(MultivaluedMap<String, String> queryParams) {
        _queryParams = queryParams;
    }

    public MultivaluedMap<String, String> getHeaders() {
        return _headers != null ? _headers : new MultivaluedHashMap<>();
    }

    public void setHeaders(MultivaluedMap<String, String> headers) {
        _headers = headers;
    }

    public boolean isSse() {
        return _isSse;
    }

    public void setSse(boolean isSse) {
        _isSse = isSse;
    }

    public void setStartTime(Instant st) {
        _st = st;
    }

    public Instant getStartTime() {
        return _st;
    }

    public String getServiceName() {
        return _serviceName;
    }

    public void setServiceName(String serviceName) {
        _serviceName = serviceName;
    }

    public String getPathType() {
        return _pathType;
    }

    public void setPathType(String pathType) {
        _pathType = pathType;
    }
}
