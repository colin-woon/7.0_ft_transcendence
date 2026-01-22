package org.bumIntra.gateway.filter;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.bumIntra.gateway.obs.GatewayObserverLogging;
import org.bumIntra.gateway.obs.GatewayRequestEnd;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.HEADER_DECORATOR)
public class ResponseContextFilter implements ContainerResponseFilter {

	@Inject
	GatewayRequestContext ctx;

	@Inject
	GatewayObserverLogging obs;

	@Override
	public void filter(ContainerRequestContext request, ContainerResponseContext response) {

		// Echo X-Request-Id header back to client
		if (ctx.getRequestId() != null) {
			response.getHeaders().putSingle("X-Request-Id", ctx.getRequestId());
		}

		// Obs end hook
		Instant st = (Instant) request.getProperty("gw.start");
		if (st == null) {
			return;
		}

		int status = response.getStatus();
		obs.onRequestEnd(
				new GatewayRequestEnd(
						ctx.getRequestId(),
						status,
						Duration.between(st, Instant.now()),
						status >= 200 && status < 400,
						Optional.empty()));
	}
}
