package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.config.GatewayRateLimitConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.RateLimitException;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.ratelimit.InMemTokenBucketRateLimiter;

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

	@Inject
	InMemTokenBucketRateLimiter rateLimiter;

	@Override
	public void filter(ContainerRequestContext request) {

		if (!grlc.enabled()) {
			return;
		}

		rateLimiter.configure(grlc.limit(), grlc.window());

		String key = buildKey(request);

		boolean allowed = rateLimiter.tryConsume(key);
		if (!allowed) {
			grc.setError(
					GatewayErrorCode.RATE_LIMITED.toString(),
					Response.Status.TOO_MANY_REQUESTS.getStatusCode());
			throw new RateLimitException();
		}
	}

	private String buildKey(ContainerRequestContext request) {

		String ip = resolveClientIp(request);

		String auth = request.getHeaderString("Authorization");
		if (auth != null && auth.length() > 32) {
			auth = auth.substring(0, 32); // safety truncate
		}

		return "ip: " + ip + "| auth: " + (auth != null ? auth : "none");
	}

	private String resolveClientIp(ContainerRequestContext request) {
		// String xfwd = request.getHeaderString("X-Forwarded-For");
		// if (xfwd != null && !xfwd.isBlank()) {
		// String[] parts = xfwd.split(",");
		// return parts[0].trim();
		// }
		// String ip = grc.getClientIp();
		// if (ip != null && !ip.isBlank()) {
		// return ip;
		// }
		// return "unknown";

		// Do NOT trust forwarded headers yet
		// Until you add trusted proxy config
		return request.getUriInfo().getRequestUri().getHost();

	}
}
