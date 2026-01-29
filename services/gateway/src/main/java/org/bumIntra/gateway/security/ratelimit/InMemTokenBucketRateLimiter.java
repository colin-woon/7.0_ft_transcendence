package org.bumIntra.gateway.security.ratelimit;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class InMemTokenBucketRateLimiter implements RateLimiter {

	private static final class Bucket {
		double tokens;
		long lastRefillTimestamp;
		final double capacity;
		final double refillTokensPerSecond;

		Bucket(RateLimitProfile profile, long now) {
			this.capacity = profile.capacity();
			this.refillTokensPerSecond = (double) profile.capacity() / (profile.refillPeriod().toMillis() / 1000.0);
			this.tokens = capacity - 1.0;
			this.lastRefillTimestamp = now;
		}
	}

	private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

	// private volatile long capacity = 60;
	// private volatile double refillTokensPerSecond = 1.0;
	//
	// public void configure(long limit, Duration window) {
	// long safeLimit = Math.max(1, limit);
	// long safeWindowMs = Math.max(1, window.toMillis());
	//
	// this.capacity = safeLimit;
	// this.refillTokensPerSecond = (double) safeLimit / (safeWindowMs / 1000.0);
	// }

	@Override
	public boolean tryConsume(String key, RateLimitProfile profile) {

		if (key == null || key.isBlank()) {
			return true;
		}

		final long now = System.nanoTime();

		Bucket b = buckets.compute(key, (k, currentBucket) -> {
			if (currentBucket == null) {
				// Bucket nb = new Bucket(capacity, now);
				// nb.tokens = Math.max(0, nb.tokens - 1.0);
				// return nb;
				return new Bucket(profile, now);
			}

			refill(currentBucket, now);

			if (currentBucket.tokens >= 1.0) {
				currentBucket.tokens -= 1.0;
			}

			return currentBucket;
		});

		return b.tokens >= 0.0 && (b.tokens >= 0.0 && !isEmpty(b));

	}

	private void refill(Bucket b, long now) {
		long elapsedTimeNS = now - b.lastRefillTimestamp;

		if (elapsedTimeNS <= 0) {
			return;
		}

		double elapsedTimeSec = elapsedTimeNS / 1_000_000_000.0;
		double refillAmount = elapsedTimeSec * b.refillTokensPerSecond;

		if (refillAmount > 0) {
			b.tokens = Math.min(b.capacity, b.tokens + refillAmount);
			b.lastRefillTimestamp = now;
		}
	}

	private boolean isEmpty(Bucket b) {
		return b.tokens < 1.0;
	}
}
