package org.bumIntra.gateway.filter;

import org.jboss.logging.MDC;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.IdentityHeaders;
import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.event.GatewayRequestStart;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
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

		populateGrcContext(request);

		// MDC - Mapped Diagnostic Context for logging
		MDC.put("requestId", grc.getRequestId());

		// Obs Hook start
		Instant st = Instant.now();
		obs.onRequestStart(new GatewayRequestStart(
				grc.getRequestId(),
				request.getMethod(),
				grc.getPath(),
				st));

		request.setProperty("gw.start", st);
		grc.setStartTime(st);
	}

	private void populateGrcContext(ContainerRequestContext request) {

		grc.clearError();

		// TODO: update the X- headers to be something unique if needed
		String requestId = request.getHeaderString(IdentityHeaders.REQUEST_ID);

		if (requestId == null || requestId.isBlank()) {
			requestId = UUID.randomUUID().toString();
		}

		grc.setRequestId(requestId);
		grc.setPath(request.getUriInfo().getPath());
		grc.setQueryParams(request.getUriInfo().getQueryParameters());
		grc.setHeaders(request.getHeaders());

		grc.setRealIp(request.getHeaderString(IdentityHeaders.INTRA_REAL_IP));
		grc.setForwardedFor(request.getHeaderString(IdentityHeaders.INTRA_FORWARDED_FOR));
		grc.setForwardedHost(request.getHeaderString(IdentityHeaders.INTRA_FORWARDED_HOST));
		grc.setForwardedProto(request.getHeaderString(IdentityHeaders.INTRA_FORWARDED_PROTO));

		// RateLimitAccess TODO: to be review later

		if (grc.getRealIp() == null || grc.getRealIp().isBlank()) {
			if (grc.getForwardedFor() != null && !grc.getForwardedFor().isBlank()) {
				grc.setClientIp(grc.getForwardedFor().split(",")[0].trim());
			} else {
				grc.setClientIp("unknown");
				grc.setInternal(true);
			}
		} else {
			grc.setClientIp(grc.getRealIp().trim());
		}

		// SSE event checks, default to false for java.
		if ((grc.getPath().startsWith("stream/") || grc.getPath().startsWith("/stream/"))
				&& "GET".equalsIgnoreCase(request.getMethod())
				&& request.getHeaderString("Accept") != null
				&& request.getHeaderString("Accept").toLowerCase(Locale.ROOT).contains("text/event-stream")) {
			grc.setSse(true);
		}
	}
}
