package org.bumIntra.gateway.websocket.grafana;

import java.io.IOException;
import java.net.URI;
import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import jakarta.websocket.Session;
import jakarta.ws.rs.core.HttpHeaders;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpClient;
import io.vertx.core.http.HttpClientOptions;
import io.vertx.core.http.WebSocket;
import io.vertx.core.http.WebSocketConnectOptions;
import io.vertx.core.net.PfxOptions;

@ApplicationScoped
public class GrafanaWsBridgeService {

    @Inject
    GrafanaWsRegistry registry;

    @ConfigProperty(name = "services.grafana.url")
    String grafanaBaseUrl;

    @ConfigProperty(name = "quarkus.rest-client.grafana-service.trust-store")
    Optional<String> trustStorePath;

    @ConfigProperty(name = "quarkus.rest-client.grafana-service.trust-store-password")
    Optional<String> trustStorePassword;

    @Inject
    Vertx vertx;

    @Inject
    org.bumIntra.gateway.websocket.core.WsObsHandler obsHandler;

    private volatile HttpClient httpClient;

    public void connect(Session clientSession) {
        URI grafanaWsUri = buildGrafanaWsUri();
        HttpClient client = getOrCreateHttpClient(grafanaWsUri);
        WebSocketConnectOptions connectOptions = buildConnectOptions(clientSession, grafanaWsUri);

        client.webSocket(connectOptions)
                .onSuccess(serviceSession -> {
                    registry.registerSession(clientSession, serviceSession);
                    serviceSession.textMessageHandler(message -> forwardToClient(clientSession, message));
                    serviceSession.closeHandler(v -> closePair(clientSession));
                    serviceSession.exceptionHandler(e -> closePair(clientSession));
                })
                .onFailure(e -> failConnect(clientSession, e));
    }

    public void forwardToGrafana(Session clientSession, String message) {
        WebSocket serviceSession = registry.getServiceSession(clientSession);

        if (serviceSession == null || serviceSession.isClosed()) {
            closePair(clientSession);
            closeQuietly(clientSession, CloseReason.CloseCodes.VIOLATED_POLICY, "No active Grafana WebSocket session");
            return;
        }

        serviceSession.writeTextMessage(message)
                .onFailure(e -> {
                    obsHandler.onBridgeFailure("grafana", e);
                    closePair(clientSession);
                });
    }

    public void forwardToClient(Session clientSession, String message) {
        if (clientSession == null || !clientSession.isOpen()) {
            return;
        }

        clientSession.getAsyncRemote().sendText(message);
    }

    public void closePair(Session clientSession) {
        WebSocket serviceSession = registry.removeByClient(clientSession);
        closeQuietly(serviceSession);

        closeQuietly(clientSession, CloseReason.CloseCodes.GOING_AWAY, "Service session closed");
    }

    URI buildGrafanaWsUri() {
        String wsBase = grafanaBaseUrl
                .replaceFirst("^https://", "wss://")
                .replaceFirst("^http://", "ws://");

        return URI.create(wsBase + "/api/live/ws");
    }

    private WebSocketConnectOptions buildConnectOptions(Session clientSession, URI grafanaWsUri) {
        String cookieHeader = (String) clientSession.getUserProperties().get(HttpHeaders.COOKIE);

        WebSocketConnectOptions options = new WebSocketConnectOptions()
                .setHost(grafanaWsUri.getHost())
                .setPort(resolvePort(grafanaWsUri))
                .setSsl("wss".equalsIgnoreCase(grafanaWsUri.getScheme()))
                .setURI(grafanaWsUri.getRawPath())
                .setConnectTimeout(5000);

        if (cookieHeader != null && !cookieHeader.isBlank()) {
            options.putHeader(HttpHeaders.COOKIE, cookieHeader);
        }

        return options;
    }

    private void closeQuietly(Session session, CloseReason.CloseCodes code, String reason) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            if (reason == null || reason.isBlank()) {
                session.close();
            } else {
                session.close(new CloseReason(code, reason));
            }
        } catch (IOException e) {
            obsHandler.onBridgeFailure("grafana", e);
        }
    }

    private void closeQuietly(WebSocket session) {
        if (session == null || session.isClosed()) {
            return;
        }

        session.close();
    }

    private HttpClient getOrCreateHttpClient(URI grafanaWsUri) {
        HttpClient existing = httpClient;
        if (existing != null) {
            return existing;
        }

        synchronized (this) {
            if (httpClient != null) {
                return httpClient;
            }

            HttpClientOptions options = new HttpClientOptions();

            if ("wss".equalsIgnoreCase(grafanaWsUri.getScheme())) {
                options.setSsl(true);
                options.setVerifyHost(true);
                if (trustStorePath.isPresent() && trustStorePassword.isPresent()) {
                    options.setTrustOptions(new PfxOptions()
                            .setPath(trustStorePath.get())
                            .setPassword(trustStorePassword.get()));
                }
            }

            httpClient = vertx.createHttpClient(options);
            return httpClient;
        }
    }

    private int resolvePort(URI uri) {
        if (uri.getPort() != -1) {
            return uri.getPort();
        }
        return "wss".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }

    @PreDestroy
    void shutdown() {
        HttpClient client = httpClient;
        httpClient = null;

        if (client != null) {
            client.close();
        }
    }

    private void failConnect(Session clientSession, Throwable cause) {
        obsHandler.onBridgeFailure("grafana", cause);
        closeQuietly(clientSession, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Internal Upstream Error");
    }
}
