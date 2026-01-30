package org.bumIntra.gateway.security.ratelimit;

import java.time.Duration;
import java.util.Map;

import org.bumIntra.gateway.config.GatewayRateLimitConfig;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RateLimitProfiles {

	@Inject
	GatewayRateLimitConfig grlc;

	// private final Map<RateLimitAccess, RateLimitProfile> profiles = Map.of(
	// RateLimitAccess.GUEST, new RateLimitProfile(20,
	// java.time.Duration.ofSeconds(10)),
	// RateLimitAccess.USER, new RateLimitProfile(100,
	// java.time.Duration.ofSeconds(10)),
	// RateLimitAccess.SERVICE, new RateLimitProfile(1000,
	// java.time.Duration.ofSeconds(10)));

	public RateLimitProfile getProfile(RateLimitAccess access) {

		long baseLimit = grlc.limit();
		Duration baseWindow = grlc.window();

		return switch (access) {
			case GUEST -> new RateLimitProfile(Math.max(1, baseLimit / 3), baseWindow);
			case USER -> new RateLimitProfile(Math.max(1, baseLimit), baseWindow);
			case SERVICE -> new RateLimitProfile(Math.max(1, baseLimit * 10), baseWindow);
		};
	}
}
