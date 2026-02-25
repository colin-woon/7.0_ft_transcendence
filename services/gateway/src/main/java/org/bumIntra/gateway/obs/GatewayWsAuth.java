package org.bumIntra.gateway.obs;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

public record GatewayWsAuth(
		String sessionId,
		String clientIp,
		Optional<String> userId,
		boolean success,
		Optional<String> reason,
		Duration latency,
		Instant at) {
}
