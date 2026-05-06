package org.bumIntra.gateway.websocket.grafana;

import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.websocket.core.WsConnectionHandler;
import org.bumIntra.gateway.websocket.core.WsHandshakeConfig;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

@ServerEndpoint(value = "/api/admin/grafana/api/live/ws", configurator = WsHandshakeConfig.class)
@ApplicationScoped
public class GrafanaWsServer {

    @Inject
    WsConnectionHandler connectionHandler;

    @Inject
    GrafanaWsBridgeService bridgeService;

    @OnOpen
    public void onOpen(Session session) {
        connectionHandler.handleConnectionOpen(session, AuthLevel.ADMIN, () -> bridgeService.connect(session));
    }

    @OnClose
    public void onClose(Session session, jakarta.websocket.CloseReason reason) {
        connectionHandler.handleConnectionClose(session, reason);
        bridgeService.closePair(session);
    }

    @OnMessage
    public void onMessage(Session session, String message) {
        connectionHandler.allowIncomingFrame(session, () -> {
            bridgeService.forwardToGrafana(session, message);
        });
    }

    @OnError
    public void onError(Session session, Throwable e) {
        connectionHandler.handleConnectionError(session, e);
        bridgeService.closePair(session);
    }

}
