package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.config.GatewayRateLimitConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.RateLimitException;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.ratelimit.InMemTokenBucketRateLimiter;
import org.bumIntra.gateway.security.ratelimit.RateLimitAccess;
import org.bumIntra.gateway.security.ratelimit.RateLimitAccessResolver;
import org.bumIntra.gateway.security.ratelimit.RateLimitProfile;
import org.bumIntra.gateway.security.ratelimit.RateLimitProfiles;
import org.bumIntra.gateway.security.ratelimit.RedisTokenBucketRateLimiter;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 70)
public class RateLimitFilter implements ContainerRequestFilter {

	@Inject
	GatewayRateLimitConfig grlc;

	@Inject
	GatewayRequestContext grc;

	// @Inject
	// InMemTokenBucketRateLimiter rateLimiter;

	// can create dev/test and prod implementations
	// and use @Alternative with beans.xml to select which one to use
	@Inject
	RedisTokenBucketRateLimiter rateLimiter;

	@Inject
	RateLimitProfiles profiles;

	@Inject
	RateLimitAccessResolver rlas;

	@Override
	public void filter(ContainerRequestContext request) {

		if (!grlc.enabled()) {
			return;
		}

		RateLimitAccess access = rlas.resolve(grc);
		RateLimitProfile profile = profiles.getProfile(access);
		String key = access + ":" + (grc.getRateLimitKey() == null || grc.getRateLimitKey().isBlank() ? "unknown"
				: grc.getRateLimitKey()); // TODO: hash the key

		boolean allowed = rateLimiter.tryConsume(key, profile);
		if (!allowed) {
			grc.setError(
					GatewayErrorCode.RATE_LIMITED.toString(),
					Response.Status.TOO_MANY_REQUESTS.getStatusCode());
			throw new RateLimitException();
		}
	}
}
