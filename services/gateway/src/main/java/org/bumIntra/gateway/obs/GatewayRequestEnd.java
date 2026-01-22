package org.bumIntra.gateway.obs;

import java.time.Duration;
import java.util.Optional;

public record GatewayRequestEnd(
		String requestId,
		int httpStatus,
		Duration latency,
		boolean success,
		Optional<String> errorCode) {
}
