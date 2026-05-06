package org.bumIntra.gateway.websocket.core;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;

public class WsHandshakeConfig extends ServerEndpointConfig.Configurator {

    @Override
    public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {

        Map<String, List<String>> headers = request.getHeaders();
        String requestId = firstHeader(headers, IdentityHeaders.REQUEST_ID);

        List<String> headerNames = List.of(
                IdentityHeaders.REQUEST_ID,
                HttpHeaders.COOKIE,
                IdentityHeaders.INTRA_REAL_IP,
                IdentityHeaders.INTRA_FORWARDED_FOR,
                IdentityHeaders.INTRA_FORWARDED_HOST,
                IdentityHeaders.INTRA_FORWARDED_PROTO);

        sec.getUserProperties().clear();

        for (String ih : headerNames) {
            populateHeaders(sec, headers, ih);
        }

        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        sec.getUserProperties().put(IdentityHeaders.REQUEST_ID, requestId);

        String realIp = firstHeader(headers, IdentityHeaders.INTRA_REAL_IP);
        String forwardedFor = firstHeader(headers, IdentityHeaders.INTRA_FORWARDED_FOR);

        if (realIp == null || realIp.isBlank()) {
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, forwardedFor.split(",")[0].trim());
            } else {
                sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, "unknown");
            }
        } else {
            sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, realIp.trim());
        }
    }

    private String firstHeader(Map<String, List<String>> headers, String name) {
        List<String> values = headers.get(name);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }

    private void populateHeaders(ServerEndpointConfig sec, Map<String, List<String>> headers, String ih) {

        List<String> temp = headers.get(ih);

        if (temp == null || temp.isEmpty()) {
            return;
        } else {
            sec.getUserProperties().put(ih, temp.get(0));
        }
    }
}
