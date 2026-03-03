package org.bumIntra.gateway.websocket;

import java.util.List;
import java.util.Map;

import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;

import jakarta.enterprise.inject.spi.CDI;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;

public class AuthHandshakeConfig extends ServerEndpointConfig.Configurator {

	public static final String HP_AUTHZ = "hp.authz";
	public static final String HP_CLIENT_IP = "hp.clientIp";

	@Override
	public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {

		Map<String, List<String>> headers = request.getHeaders();

		sec.getUserProperties().remove(HP_AUTHZ);
		sec.getUserProperties().remove(HP_CLIENT_IP);

		String clientIp = null;

		for (var entry : headers.entrySet()) {

			String headerName = entry.getKey();
			List<String> values = entry.getValue();

			if (values == null || values.isEmpty()) {
				continue;
			}

			if ("authorization".equalsIgnoreCase(headerName)) {
				sec.getUserProperties().put(HP_AUTHZ, values.get(0));
			}

			if ("x-forwarded-for".equalsIgnoreCase(headerName)) {
				String raw = values.get(0);

				// Take first IP only (xff format: client, proxy1, proxy2,...)
				clientIp = raw.split(",")[0].trim();
			}

			// Fallback
			if (clientIp == null && "x-real-ip".equalsIgnoreCase(headerName)) {
				clientIp = values.get(0).trim();
			}
		}

		// Fallback: browser WebSocket API cannot set Authorization header.
		// Accept ?token=<bearer-token> as a query-parameter alternative.
		if (!sec.getUserProperties().containsKey(HP_AUTHZ)) {
			Map<String, List<String>> params = request.getParameterMap();
			List<String> tokenParam = params.get("token");
			if (tokenParam != null && !tokenParam.isEmpty() && !tokenParam.get(0).isBlank()) {
				String raw = tokenParam.get(0).trim();
				// Normalise: accept bare token or "Bearer <token>"
				String authz = raw.startsWith("Bearer ") ? raw : "Bearer " + raw;
				sec.getUserProperties().put(HP_AUTHZ, authz);
			}
		}

		if (clientIp == null || clientIp.isBlank()) {
			clientIp = "unknown";
		}

		sec.getUserProperties().put(HP_CLIENT_IP, clientIp);
	}
}
