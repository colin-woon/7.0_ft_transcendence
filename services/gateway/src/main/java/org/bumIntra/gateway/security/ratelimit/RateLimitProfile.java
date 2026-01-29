package org.bumIntra.gateway.security.ratelimit;

import java.time.Duration;

public record RateLimitProfile(int capacity, Duration refillPeriod) {
}
