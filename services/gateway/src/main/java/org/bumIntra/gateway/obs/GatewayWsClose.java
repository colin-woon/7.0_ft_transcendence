package org.bumIntra.gateway.obs;

import java.time.Instant;
import java.util.Optional;

public record GatewayWsClose(
		String sessionId,
		Optional<String> userId,
		int closeCode,
		String reason,
		Instant at) {
}
