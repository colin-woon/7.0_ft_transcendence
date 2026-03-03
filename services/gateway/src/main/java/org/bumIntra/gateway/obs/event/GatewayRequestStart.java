package org.bumIntra.gateway.obs.event;

import java.time.Instant;

public record GatewayRequestStart(
		String requestId,
		String method,
		String path,
		Instant at) {
}
