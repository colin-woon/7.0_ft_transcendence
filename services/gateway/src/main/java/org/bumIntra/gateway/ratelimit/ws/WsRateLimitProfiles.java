package org.bumIntra.gateway.ratelimit.ws;

import java.time.Duration;

import org.bumIntra.gateway.ratelimit.RateLimitProfile;

public final class WsRateLimitProfiles {

    // Pre-auth IP gate — generous enough for NAT/shared IPs
    public static final RateLimitProfile WS_PREAUTH_CONN = new RateLimitProfile(20, Duration.ofSeconds(10));

    // Post-auth per-user connection gate — limits tab spam per account
    public static final RateLimitProfile WS_AUTH_CONN = new RateLimitProfile(5, Duration.ofSeconds(10));

    // Per-user frame rate limit — protects against abusive clients
    public static final RateLimitProfile WS_FRAME = new RateLimitProfile(10, Duration.ofSeconds(1));

    private WsRateLimitProfiles() {
    }
}
