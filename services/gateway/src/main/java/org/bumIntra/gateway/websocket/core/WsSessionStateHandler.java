package org.bumIntra.gateway.websocket.core;

import java.time.Instant;

import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.Session;

@ApplicationScoped
public class WsSessionStateHandler {

    public enum AuthState {
        PENDING,
        AUTHENTICATED,
        UNAUTHORIZED
    }

    private static final String AUTH_STATE_KEY = "AuthState";
    private static final String AUTH_START_AT_KEY = "AuthStartAt";
    private static final String LAST_THROTTLE_AT_KEY = "LastThrottleAt";

    public void setAuthState(Session session, AuthState state) {
        session.getUserProperties().put(AUTH_STATE_KEY, state);
    }

    public AuthState getAuthState(Session session) {
        Object state = session.getUserProperties().get(AUTH_STATE_KEY);
        return state instanceof AuthState ? (AuthState) state : null;
    }

    public boolean isAuthenticated(Session session) {
        return getAuthState(session) == AuthState.AUTHENTICATED;
    }

    public boolean isPending(Session session) {
        return getAuthState(session) == AuthState.PENDING;
    }

    public boolean isUnauthorized(Session session) {
        return getAuthState(session) == AuthState.UNAUTHORIZED;
    }

    public void markPending(Session session) {
        setAuthState(session, AuthState.PENDING);
    }

    public void markAuthenticated(Session session) {
        setAuthState(session, AuthState.AUTHENTICATED);
    }

    public void markUnauthorized(Session session) {
        setAuthState(session, AuthState.UNAUTHORIZED);
    }

    public void updateAuthStartAt(Session session) {
        session.getUserProperties().put(AUTH_START_AT_KEY, Instant.now());
    }

    public Instant getAuthStartAt(Session session) {
        Object authStartAt = session.getUserProperties().get(AUTH_START_AT_KEY);
        return authStartAt instanceof Instant ? (Instant) authStartAt : null;
    }

    // Throttle logging
    public void updateLastThrottleAt(Session session) {
        session.getUserProperties().put(LAST_THROTTLE_AT_KEY, Instant.now());
    }

    public Instant getLastThrottleAt(Session session) {
        Object lastThrottleAt = session.getUserProperties().get(LAST_THROTTLE_AT_KEY);
        return lastThrottleAt instanceof Instant ? (Instant) lastThrottleAt : null;
    }

    public String getUserId(Session session) {
        return getSessionProperties(session, IdentityHeaders.USER_ID);
    }

    public String getClientIp(Session session) {
        return getSessionProperties(session, IdentityHeaders.CLIENT_IP);
    }

    private String getSessionProperties(Session session, String key) {
        Object val = session.getUserProperties().get(key);
        return val != null ? val.toString() : null;
    }

    public boolean checkAccess(Session session, AuthLevel requiredLevel) {
        AuthLevel userLevel = session.getUserProperties().get(IdentityHeaders.AUTH_LEVEL) instanceof AuthLevel
                ? (AuthLevel) session.getUserProperties().get(IdentityHeaders.AUTH_LEVEL)
                : AuthLevel.GUEST;

        return userLevel.isAtLeast(requiredLevel);
    }

}
