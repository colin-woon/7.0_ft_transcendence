package org.bumIntra.gateway.websocket;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;

public class WsHandshakeConfig extends ServerEndpointConfig.Configurator {

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
