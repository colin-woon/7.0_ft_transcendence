package org.bumIntra.gateway.filter;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.bumIntra.gateway.obs.GatewayObserver;
import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.GatewayObserverLogging;
import org.bumIntra.gateway.obs.event.GatewayRequestEnd;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.enterprise.inject.Instance;
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
	GatewayRequestContext grc;

	@Inject
	GatewayObserverDispatcher obs;

	@Override
	public void filter(ContainerRequestContext request, ContainerResponseContext response) {

		// Echo X-Request-Id header back to client
		if (grc.getRequestId() != null) {
			response.getHeaders().putSingle("X-Request-Id", grc.getRequestId());
		}

		if (grc.isSse()) {
			return;
		}

		// Obs end hook
		Instant st = (Instant) request.getProperty("gw.start");
		if (st == null) {
			return;
		}

		int status = response.getStatus();

		obs.onRequestEnd(new GatewayRequestEnd(
				grc.getRequestId(),
				status,
				Duration.between(st, Instant.now()),
				status >= 200 && status < 400,
				Optional.ofNullable(grc.getErrorCode()),
				Optional.ofNullable(grc.getServiceName())));

		// for (var ob : obs) {
		// ob.onRequestEnd(
		// new GatewayRequestEnd(
		// ctx.getRequestId(),
		// status,
		// Duration.between(st, Instant.now()),
		// status >= 200 && status < 400,
		// Optional.ofNullable(ctx.getErrorCode())));
		// }
	}
}
