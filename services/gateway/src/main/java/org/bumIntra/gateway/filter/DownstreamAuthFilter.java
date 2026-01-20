package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class DownstreamAuthFilter implements ClientRequestFilter {

	@Inject
	GatewayRequestContext ctx;

	@Override
	public void filter(ClientRequestContext request) {
		String authHeader = ctx.getAuth();

		if (authHeader != null && !authHeader.isBlank()) {
			request.getHeaders().putSingle("Authorization", authHeader);
		}

		String requestId = ctx.getRequestId();
		if (requestId != null && !requestId.isBlank()) {
			request.getHeaders().putSingle("X-Request-Id", requestId);
		}
	}
}
