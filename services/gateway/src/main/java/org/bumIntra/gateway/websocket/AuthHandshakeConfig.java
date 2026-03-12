package org.bumIntra.gateway.websocket;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;

public class AuthHandshakeConfig extends ServerEndpointConfig.Configurator {

	// public static final String HP_AUTHZ = "hp.authz";
	// public static final String HP_CLIENT_IP = "hp.clientIp";

	@Override
	public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {

		Map<String, List<String>> headers = request.getHeaders();
		List<String> headerNames = List.of(
				IdentityHeaders.INTRA_REAL_IP,
				IdentityHeaders.INTRA_FORWARDED_FOR,
				IdentityHeaders.INTRA_FORWARDED_HOST,
				IdentityHeaders.INTRA_FORWARDED_PROTO);

		sec.getUserProperties().clear();

		for (String ih : headerNames) {
			populateHeaders(sec, headers, ih);
		}

		sec.getUserProperties().put(IdentityHeaders.REQUEST_ID, UUID.randomUUID().toString());

		List<String> realIp = headers.get(IdentityHeaders.INTRA_REAL_IP);
		List<String> forwardedFor = headers.get(IdentityHeaders.INTRA_FORWARDED_FOR);

		if (realIp == null || realIp.isEmpty()) {
			if (forwardedFor != null && !forwardedFor.isEmpty()) {
				sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, forwardedFor.get(0).split(",")[0].trim());
			} else {
				sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, "unknown");
				sec.getUserProperties().put(IdentityHeaders.INTERNAL_REQUEST, "true");
			}
		} else {
			sec.getUserProperties().put(IdentityHeaders.CLIENT_IP, realIp.get(0).trim());
		}
		// sec.getUserProperties().remove(HP_AUTHZ);
		// sec.getUserProperties().remove(HP_CLIENT_IP);

		//
		// for (var entry : headers.entrySet()) {
		//
		// String headerName = entry.getKey();
		// List<String> values = entry.getValue();
		//
		// if (values == null || values.isEmpty()) {
		// continue;
		// }
		//
		// if ("authorization".equalsIgnoreCase(headerName)) {
		// sec.getUserProperties().put(HP_AUTHZ, values.get(0));
		// }
		//
		// if ("x-forwarded-for".equalsIgnoreCase(headerName)) {
		// String raw = values.get(0);
		//
		// // Take first IP only (xff format: client, proxy1, proxy2,...)
		// clientIp = raw.split(",")[0].trim();
		// }
		//
		// // Fallback
		// if (clientIp == null && "x-real-ip".equalsIgnoreCase(headerName)) {
		// clientIp = values.get(0).trim();
		// }
		// }
		//
		// // Fallback: browser WebSocket API cannot set Authorization header.
		// // Accept ?token=<bearer-token> as a query-parameter alternative.
		// if (!sec.getUserProperties().containsKey(HP_AUTHZ)) {
		// Map<String, List<String>> params = request.getParameterMap();
		// List<String> tokenParam = params.get("token");
		// if (tokenParam != null && !tokenParam.isEmpty() &&
		// !tokenParam.get(0).isBlank()) {
		// String raw = tokenParam.get(0).trim();
		// // Normalise: accept bare token or "Bearer <token>"
		// String authz = raw.startsWith("Bearer ") ? raw : "Bearer " + raw;
		// sec.getUserProperties().put(HP_AUTHZ, authz);
		// }
		// }
		//
		// if (clientIp == null || clientIp.isBlank()) {
		// clientIp = "unknown";
		// }
		//
		// sec.getUserProperties().put(HP_CLIENT_IP, clientIp);
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
