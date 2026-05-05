package org.bumIntra.gateway.websocket.grafana;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.Session;
import io.vertx.core.http.WebSocket;

@ApplicationScoped
public class GrafanaWsRegistry {

    private final Map<String, WebSocket> serviceByClientId = new ConcurrentHashMap<>();

    public void registerSession(Session client, WebSocket service) {
        serviceByClientId.put(client.getId(), service);
    }

    public WebSocket removeByClient(Session client) {
        return serviceByClientId.remove(client.getId());
    }

    public WebSocket getServiceSession(Session client) {
        return serviceByClientId.get(client.getId());
    }

    public int getRegistrySize() {
        return serviceByClientId.size();
    }
}
