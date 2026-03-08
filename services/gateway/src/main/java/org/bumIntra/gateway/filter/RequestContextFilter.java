package org.bumIntra.gateway.filter;

import org.jboss.logging.MDC;

import java.time.Instant;
import java.util.UUID;

import org.bumIntra.gateway.security.GatewayRequestContext;
// import org.bumIntra.gateway.config.GatewayAuthConfig;
// import org.bumIntra.gateway.exception.AuthRequiredException;
import org.bumIntra.gateway.obs.GatewayObserver;
import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.event.GatewayRequestStart;
import org.bumIntra.gateway.policy.GatewayPolicyEngine;

import jakarta.annotation.Priority;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
// import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 100)
public class RequestContextFilter implements ContainerRequestFilter {

	@Inject
	GatewayRequestContext grc;

	@Inject
	GatewayObserverDispatcher obs;

	@Override
	public void filter(ContainerRequestContext request) {

		// TODO: update the X- headers to be something unique to our gateway
		grc.clearError();

		String requestId = request.getHeaderString("X-Request-Id");

		if (requestId == null || requestId.isBlank()) {
			requestId = UUID.randomUUID().toString();
		}

		grc.setRequestId(requestId);
		grc.setPath(request.getUriInfo().getPath());

		// MDC - Mapped Diagnostic Context for logging
		MDC.put("requestId", requestId);

		// RateLimitAccess TODO: to be review later
		String clientIp = request.getHeaderString("X-Intra-Real-Ip");
		if (clientIp == null || clientIp.isBlank()) {
			clientIp = request.getHeaderString("X-Intra-Forwarded-For");
		}

		if (clientIp != null && !clientIp.isBlank()) {
			grc.setClientIp(clientIp);
		} else {
			grc.setInternal(true);
		}

		// Obs Hook start
		Instant st = Instant.now();
		obs.onRequestStart(new GatewayRequestStart(
				requestId,
				request.getMethod(),
				request.getUriInfo().getPath(),
				st));

		// for (var ob : obs) {
		// ob.onRequestStart(new GatewayRequestStart(
		// requestId,
		// request.getMethod(),
		// request.getUriInfo().getPath(),
		// st));
		// }

		request.setProperty("gw.start", st);

	}
}
