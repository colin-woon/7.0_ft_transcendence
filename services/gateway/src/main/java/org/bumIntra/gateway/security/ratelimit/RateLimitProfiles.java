package org.bumIntra.gateway.security.ratelimit;

import java.util.Map;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RateLimitProfiles {

	private final Map<RateLimitAccess, RateLimitProfile> profiles = Map.of(
			RateLimitAccess.GUEST, new RateLimitProfile(20, java.time.Duration.ofSeconds(10)),
			RateLimitAccess.USER, new RateLimitProfile(100, java.time.Duration.ofSeconds(10)),
			RateLimitAccess.SERVICE, new RateLimitProfile(1000, java.time.Duration.ofSeconds(10)));

	public RateLimitProfile getProfile(RateLimitAccess access) {
		return profiles.get(access);
	}
}
