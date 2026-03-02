package org.bumIntra.gateway.ratelimit;

public interface RateLimiter {

	boolean tryConsume(String key, RateLimitProfile profile);
}
