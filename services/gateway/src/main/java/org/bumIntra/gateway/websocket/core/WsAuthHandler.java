package org.bumIntra.gateway.websocket.core;

import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.IdentityHeaders;

import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.Session;
import jakarta.ws.rs.core.HttpHeaders;

@ApplicationScoped
public class WsAuthHandler {

    @Inject
    JWTParser jwtParser;

    @Inject
    GatewayAuthConfig gac;

    public boolean authenticate(Session session) {
        if (!gac.required()) {
            session.getUserProperties().put(IdentityHeaders.AUTH_LEVEL, AuthLevel.USER);
            return true;
        }

        return validateToken(session);

    }

    private boolean validateToken(Session session) {
        String cookieHeader = session.getUserProperties().get(HttpHeaders.COOKIE) != null
                ? session.getUserProperties().get(HttpHeaders.COOKIE).toString()
                : null;
        String accessToken = extractCookie(cookieHeader, "accessToken");

        if (accessToken == null || accessToken.isBlank()) {
            session.getUserProperties().put(IdentityHeaders.AUTH_LEVEL, AuthLevel.GUEST);
            return false;
        }

        try {
            var jwt = jwtParser.parse(accessToken);

            session.getUserProperties().put(IdentityHeaders.USER_ID, jwt.getSubject());

            if (jwt.getGroups().contains("ADMIN")) {
                session.getUserProperties().put(IdentityHeaders.AUTH_LEVEL, AuthLevel.ADMIN);
            } else {
                session.getUserProperties().put(IdentityHeaders.AUTH_LEVEL, AuthLevel.USER);
            }

            return true;
        } catch (Exception e) {
            session.getUserProperties().put(IdentityHeaders.AUTH_LEVEL, AuthLevel.GUEST);
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
}
