package org.bumIntra.gateway.security.ratelimit;

import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RedisTokenBucketRateLimiter implements RateLimiter {

	@Inject
	RedisDataSource redis;

	@Inject
	RedisScriptRegistry scriptRegistry;

	@Override
	public boolean tryConsume(String key, RateLimitProfile profile) {

		double refillRatePerSecond = computeRefillRate(profile);

		try {
			return evalOnce(
					scriptRegistry.tokenBucketSha(),
					key,
					profile.capacity(),
					refillRatePerSecond);
		} catch (Exception e) {
			if (isNoScript(e)) {
				try {
					String reloadedSha = scriptRegistry.reloadTokenBucketScript();
					return evalOnce(
							reloadedSha,
							key,
							profile.capacity(),
							refillRatePerSecond);
				} catch (Exception ex) {
					return false;
				}
			} else {
				return false;
			}
		}
	}

	private boolean evalOnce(String sha, String key, long capacity, double refillRatePerSecond) {

		var resp = redis.execute(
				"EVALSHA",
				sha,
				"1",
				key,
				String.valueOf(capacity),
				String.valueOf(refillRatePerSecond),
				"1",
				"0");

		int allowed = resp.get(0).toInteger();
		return allowed == 1;
	}

	private static double computeRefillRate(RateLimitProfile profile) {
		long refillMS = profile.refillPeriod().toMillis();
		if (refillMS <= 0) {
			throw new IllegalArgumentException("Refill period must be positive");
		}
		return profile.capacity() / (refillMS / 1000.0);
	}

	private static boolean isNoScript(Throwable t) {
		return String.valueOf(t.getMessage()).contains("NOSCRIPT");
	}
}
