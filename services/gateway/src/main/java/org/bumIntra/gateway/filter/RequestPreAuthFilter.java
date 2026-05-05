package org.bumIntra.gateway.filter;

import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import javax.security.auth.x500.X500Principal;

import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.GatewayTokenRefreshService;
import org.bumIntra.gateway.security.TokenRefreshResult;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Provider
@Priority(Priorities.AUTHENTICATION - 70)
public class RequestPreAuthFilter implements ContainerRequestFilter {

    @Inject
    GatewayRequestContext grc;

    @Inject
    GatewayAuthConfig gac;

    @Inject
    SecurityIdentity si;

    @Inject
    JWTParser jwtParser;

    @Inject
    GatewayTokenRefreshService trs;

    @Override
    public void filter(ContainerRequestContext request) {

        boolean isInvalidAuth = populateAuth();

        boolean isPublicPath = gac.getPublicPaths().stream().anyMatch(grc.getPath()::startsWith);
        grc.setPublic(isPublicPath);

        if ((grc.isInternal() && grc.getAuthLevel() == AuthLevel.SERVICE) || isPublicPath || !gac.required()) {
            return;
        }

        if (isInvalidAuth) {
            throw new GatewayException(
                    Response.Status.UNAUTHORIZED,
                    GatewayErrorCode.AUTH_INVALID,
                    "Invalid authentication token");
        }

        if (!grc.getAuthLevel().equals(AuthLevel.USER) && !grc.getAuthLevel().equals(AuthLevel.ADMIN)) {
            throw new GatewayException(
                    Response.Status.UNAUTHORIZED,
                    GatewayErrorCode.AUTH_REQUIRED,
                    "Authentication is required");
        }

    }

    private boolean populateAuth() {
        String cookieHeader = grc.getHeaders().getFirst(HttpHeaders.COOKIE);
        String accessToken = extractCookie(cookieHeader, "accessToken");
        String sessionId = extractCookie(cookieHeader, "sessionId");

        if (accessToken != null && !accessToken.isBlank() && tryAccess(accessToken)) {
            return false;
        }

        if (tryAdminRefresh(sessionId)) {
            return false;
        }

        if (si.getPrincipal() instanceof X500Principal) {
            grc.setAuthLevel(AuthLevel.SERVICE);
            return false;
        }

        return accessToken != null && !accessToken.isBlank();
    }

    private boolean tryAccess(String accessToken) {
        try {
            JsonWebToken jwt = jwtParser.parse(accessToken);
            populateJwtClaims(jwt);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean tryAdminRefresh(String sessionId) {
        if (!"admin".equals(grc.getPathType())) {
            return false;
        }

        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }

        try {
            TokenRefreshResult refreshResult = trs.refresh(sessionId);
            JsonWebToken jwt = jwtParser.parse(refreshResult.accessToken());
            populateJwtClaims(jwt);
            grc.setRefreshCookie(refreshResult.setCookieHeader());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String extractCookie(String cookieHeader, String cookieName) {
        String prefix = cookieName + "=";

        if (cookieHeader == null || cookieHeader.trim().isEmpty()) {
            return null;
        }

        for (String cookie : cookieHeader.split(";")) {
            String trimmed = cookie.trim();
            if (trimmed.startsWith(prefix)) {
                return trimmed.substring(prefix.length());
            }
        }

        return null;
    }

    private void populateJwtClaims(JsonWebToken jwt) {
        grc.setUserId(jwt.getSubject());
        grc.setRoles(jwt.getGroups());

        if (jwt.getGroups().contains("ADMIN")) {
            grc.setAuthLevel(AuthLevel.ADMIN);
        } else {
            grc.setAuthLevel(AuthLevel.USER);
        }

        if (grc.getAuthLevel() == AuthLevel.ADMIN && grc.isLab()) {
            grc.setAuthLevel(AuthLevel.USER);
        }
    }
}
