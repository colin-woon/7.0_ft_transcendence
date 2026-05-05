package org.bumIntra.gateway.websocket.core;

import org.bumIntra.gateway.ratelimit.ws.WsRateLimiter;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.obs.event.GatewayWsThrottle;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import jakarta.websocket.Session;

@ApplicationScoped
public class WsConnectionHandler {

    @Inject
    WsAuthHandler authHandler;

    @Inject
    WsObsHandler obsHandler;

    @Inject
    WsRateLimiter rlHandler;

    @Inject
    WsSessionStateHandler stateHandler;

    public void handleConnectionOpen(Session session, AuthLevel requiredAuthLevel, Runnable onAuthorized) {
        stateHandler.markPending(session);
        stateHandler.updateAuthStartAt(session);
        obsHandler.onOpen(session);

        if (!isValidSession(session)) {
            return;
        }

        execAuth(session, requiredAuthLevel, onAuthorized);
    }

    public void handleConnectionClose(Session session, CloseReason reason) {
        obsHandler.onClose(session, reason);
    }

    public void handleConnectionError(Session session, Throwable e) {
        obsHandler.onError(session, e);
    }

    public void allowIncomingFrame(Session session, Runnable onAllowed) {
        if (stateHandler.isPending(session)) {
            return;
        }

        if (stateHandler.isUnauthorized(session) || !stateHandler.isAuthenticated(session)) {
            obsHandler.onAuthFailure(session, "Unauthorized message attempt");
            terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Unauthorized");
            return;
        }

        rlHandler.allowFrameTraffic(stateHandler.getUserId(session))
                .subscribe().with(allowed -> {
                    if (!allowed) {
                        obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.FRAME);
                        terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER, "Frame Rate limit exceeded");
                        return;
                    }

                    onAllowed.run();
                }, e -> {
                    obsHandler.onError(session, e);
                    terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Internal error");
                    return;
                });
    }

    private boolean isValidSession(Session session) {
        String clientIp = stateHandler.getClientIp(session);

        if (clientIp == null || clientIp.isEmpty() || clientIp.equalsIgnoreCase("unknown")) {
            obsHandler.onAuthFailure(session, "Invalid Client IP");
            terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Invalid Client IP");
            return false;
        }
        return true;
    }

    private void terminateSession(Session session, CloseReason.CloseCodes code, String reason) {
        try {
            if (session != null && session.isOpen()) {
                session.close(new CloseReason(code, reason));
            }
        } catch (Exception e) {
            obsHandler.onError(session, e);
        }
    }

    private void execAuth(Session session, AuthLevel requiredAuthLevel, Runnable onAuthorized) {
        rlHandler.allowPreAuthConnection(stateHandler.getClientIp(session))
                .subscribe().with(allowed -> {
                    if (!allowed) {
                        obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.CONN_IP);
                        terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER, "Rate limit exceeded");
                        return;
                    }

                    if (!authHandler.authenticate(session)) {
                        obsHandler.onAuthFailure(session, "Unauthorized");
                        stateHandler.markUnauthorized(session);
                        terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Unauthorized");
                        return;
                    }

                    if (!stateHandler.checkAccess(session, requiredAuthLevel)) {
                        obsHandler.onAuthFailure(session, "Insufficient permissions");
                        stateHandler.markUnauthorized(session);
                        terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY,
                                "Insufficient permissions");
                        return;
                    }

                    rlHandler.allowAuthenticatedConnection(stateHandler.getUserId(session))
                            .subscribe().with(userAllowed -> {
                                if (!userAllowed) {
                                    obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.CONN_USER);
                                    terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
                                            "User rate limit exceeded");
                                    return;
                                }

                                stateHandler.markAuthenticated(session);
                                obsHandler.onAuthSuccess(session);
                                onAuthorized.run();

                            }, e -> {
                                obsHandler.onError(session, e);
                                terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION,
                                        "Internal error");
                            });

                }, e -> {
                    obsHandler.onError(session, e);
                    terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Internal error");
                });
    }

}
