package org.bumIntra.gateway.websocket.ratelimit;

import java.time.Duration;

import org.bumIntra.gateway.security.ratelimit.RateLimitProfile;

public final class WsRateLimitProfiles {

	// Pre-auth IP gate — generous enough for NAT/shared IPs
	public static final RateLimitProfile WS_CONN = new RateLimitProfile(20, Duration.ofSeconds(10));

	// Post-auth per-user connection gate — limits tab spam per account
	public static final RateLimitProfile WS_CONN_USER = new RateLimitProfile(5, Duration.ofSeconds(10));

	// Per-user message rate
	public static final RateLimitProfile WS_MSG = new RateLimitProfile(10, Duration.ofSeconds(1));

	private WsRateLimitProfiles() {
	}
}
