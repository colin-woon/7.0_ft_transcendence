package org.bumIntra.gateway.security.ratelimit;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class InMemTokenBucketRateLimiter implements RateLimiter {

	private static final class Bucket {
		double tokens;
		long lastRefillTimestamp;

		Bucket(double tokens, long lastRefillTimestamp) {
			this.tokens = tokens;
			this.lastRefillTimestamp = lastRefillTimestamp;
		}
	}

	private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

	private volatile long capacity = 60;
	private volatile double refillTokensPerSecond = 1.0;

	public void configure(long limit, Duration window) {
		long safeLimit = Math.max(1, limit);
		long safeWindowMs = Math.max(1, window.toMillis());

		this.capacity = safeLimit;
		this.refillTokensPerSecond = (double) safeLimit / (safeWindowMs / 1000.0);
	}

	@Override
	public boolean tryConsume(String key) {

		if (key == null || key.isBlank()) {
			return true;
		}

		final long now = System.nanoTime();

		Bucket b = buckets.compute(key, (k, currentBucket) -> {
			if (currentBucket == null) {
				Bucket nb = new Bucket(capacity, now);
				nb.tokens = Math.max(0, nb.tokens - 1.0);
				return nb;
			}

			refill(currentBucket, now);
			if (currentBucket.tokens >= 1.0) {
				currentBucket.tokens -= 1.0;
				return currentBucket;
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
		double refillAmount = elapsedTimeSec * refillTokensPerSecond;

		if (refillAmount > 0) {
			b.tokens = Math.min(capacity, b.tokens + refillAmount);
			b.lastRefillTimestamp = now;
		}
	}

	private boolean isEmpty(Bucket b) {
		return b.tokens < 1.0;
	}
}
