package org.bumIntra.gateway.obs;

import java.time.Instant;

public record GatewayWsOpen(
		String sessionId,
		String clientIp,
		Instant at) {
}
