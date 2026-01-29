package org.bumIntra.gateway.security.ratelimit;

public interface RateLimiter {

	boolean tryConsume(String key, RateLimitProfile profile);
}
