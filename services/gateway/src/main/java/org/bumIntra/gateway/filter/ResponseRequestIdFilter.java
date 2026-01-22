package org.bumIntra.gateway.filter;

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
public class ResponseRequestIdFilter implements ContainerResponseFilter {

	@Inject
	GatewayRequestContext ctx;

	@Override
	public void filter(ContainerRequestContext request, ContainerResponseContext response) {

		if (ctx.getRequestId() != null) {
			response.getHeaders().putSingle("X-Request-Id", ctx.getRequestId());
		}
	}
}
