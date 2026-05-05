package org.bumIntra.gateway.websocket.core;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.event.GatewayWsAuth;
import org.bumIntra.gateway.obs.event.GatewayWsClose;
import org.bumIntra.gateway.obs.event.GatewayWsOpen;
import org.bumIntra.gateway.obs.event.GatewayWsThrottle;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import jakarta.websocket.Session;

@ApplicationScoped
public class WsObsHandler {

    @Inject
    GatewayObserverDispatcher obs;

    @Inject
    WsSessionStateHandler stateHandler;

    public void onOpen(Session session) {

        obs.onWsOpen(new GatewayWsOpen(
                session.getId(),
                stateHandler.getClientIp(session),
                Instant.now()));
    }

    public void onClose(Session session, CloseReason reason) {

        obs.onWsClose(new GatewayWsClose(
                session.getId(),
                Optional.ofNullable(stateHandler.getUserId(session)),
                reason.getCloseCode().getCode(), reason.getReasonPhrase(),
                Instant.now()));

    }

    public void onError(Session session, Throwable e) {
        obs.onWsError(session != null ? session.getId() : "unknown", e);
    }

    public void onAuthSuccess(Session session) {
        obs.onWsAuth(new GatewayWsAuth(
                session.getId(),
                stateHandler.getClientIp(session),
                Optional.ofNullable(stateHandler.getUserId(session)),
                true,
                Optional.empty(),
                authLatency(session),
                Instant.now()));
    }

    public void onAuthFailure(Session session, String reason) {
        obs.onWsAuth(new GatewayWsAuth(
                session.getId(),
                stateHandler.getClientIp(session),
                Optional.ofNullable(stateHandler.getUserId(session)),
                false,
                Optional.ofNullable(reason),
                authLatency(session),
                Instant.now()));
    }

    public void onThrottle(Session session, GatewayWsThrottle.WsThrottleType type) {
        obs.onWsThrottle(new GatewayWsThrottle(
                session.getId(),
                stateHandler.getClientIp(session),
                Optional.ofNullable(stateHandler.getUserId(session)),
                type,
                Instant.now()));
    }

    public void onBridgeFailure(String serviceName, Throwable t) {
        obs.onWsBridgeFailure(serviceName, t);
    }

    private Optional<Duration> authLatency(Session session) {
        Instant authSt = stateHandler.getAuthStartAt(session);
        return authSt != null
                ? Optional.of(Duration.between(authSt, Instant.now()))
                : Optional.empty();
    }
}
