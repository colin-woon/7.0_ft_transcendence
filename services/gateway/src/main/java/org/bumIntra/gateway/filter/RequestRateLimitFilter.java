package org.bumIntra.gateway.filter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.bumIntra.gateway.config.GatewayRateLimitConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.RateLimitException;
import org.bumIntra.gateway.security.GatewayRequestContext;

import io.quarkus.arc.properties.IfBuildProperty;

import org.bumIntra.gateway.ratelimit.InMemTokenBucketRateLimiter;
import org.bumIntra.gateway.ratelimit.RateLimitAccess;
import org.bumIntra.gateway.ratelimit.RateLimitAccessResolver;
import org.bumIntra.gateway.ratelimit.RateLimitProfile;
import org.bumIntra.gateway.ratelimit.RateLimitProfiles;
import org.bumIntra.gateway.ratelimit.RedisTokenBucketRateLimiter;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHORIZATION - 100)
@IfBuildProperty(name = "gateway.config.ratelimit.enabled", stringValue = "true")
public class RequestRateLimitFilter implements ContainerRequestFilter {

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
				: hash(grc.getRateLimitKey()));

		boolean allowed = rateLimiter.tryConsume(key, profile);
		if (!allowed) {
			grc.setError(
					GatewayErrorCode.RATE_LIMITED.toString(),
					Response.Status.TOO_MANY_REQUESTS.getStatusCode());
			throw new RateLimitException();
		}
	}

	private String hash(String input) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hashBytes);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 not available", e);
		}
	}
}
