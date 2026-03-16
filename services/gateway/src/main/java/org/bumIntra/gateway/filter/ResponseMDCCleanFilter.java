package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.security.GatewayRequestContext;
import org.jboss.logging.MDC;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.HEADER_DECORATOR + 100) // Run after header decorators and observers
public class ResponseMDCCleanFilter implements ContainerResponseFilter {

	@Inject
	GatewayRequestContext grc;

	@Override
	public void filter(ContainerRequestContext request, ContainerResponseContext response) {
		// Clean up MDC after request is processed
		if (grc.isSse()) {
			// For SSE requests, we want to keep MDC until the connection is closed
			return;
		}
		MDC.clear();
	}
}
