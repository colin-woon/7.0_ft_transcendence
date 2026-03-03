package org.bumIntra.gateway.ratelimit;

import java.time.Duration;

public record RateLimitProfile(long capacity, Duration refillPeriod) {
}
