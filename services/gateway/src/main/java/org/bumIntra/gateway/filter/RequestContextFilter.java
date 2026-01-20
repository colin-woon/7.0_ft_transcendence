package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.exception.AuthRequiredException;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class RequestContextFilter implements ContainerRequestFilter {

	@Inject
	GatewayAuthConfig authConfig;

	@Inject
	GatewayRequestContext ctx;

	@Override
	public void filter(ContainerRequestContext request) {

		String requestId = request.getHeaderString("X-Request-Id");

		if (requestId == null || requestId.isBlank()) {
			requestId = java.util.UUID.randomUUID().toString();
		}

		ctx.setRequestId(requestId);

		String authHeader = request.getHeaderString("Authorization");

		ctx.setAuth(authHeader);

		if (authConfig.required() && (authHeader == null || authHeader.isBlank())) {

			throw new AuthRequiredException();

			// request.abortWith(
			// Response.status(Response.Status.UNAUTHORIZED).entity("Authorization header is
			// required").build());
		}
	}
}
