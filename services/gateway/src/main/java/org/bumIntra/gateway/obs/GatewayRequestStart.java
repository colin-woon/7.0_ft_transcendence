package org.bumIntra.gateway.obs;

import java.time.Instant;

public record GatewayRequestStart(
		String requestId,
		String method,
		String path,
		Instant at) {
}
