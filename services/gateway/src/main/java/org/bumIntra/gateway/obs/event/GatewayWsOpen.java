package org.bumIntra.gateway.obs.event;

import java.time.Instant;

public record GatewayWsOpen(
		String sessionId,
		String clientIp,
		Instant at) {
}
