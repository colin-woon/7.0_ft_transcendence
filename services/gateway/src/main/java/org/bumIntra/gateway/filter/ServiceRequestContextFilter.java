package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.policy.GatewayPolicyEngine;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
// @Priority(Priorities.AUTHENTICATION)
public class ServiceRequestContextFilter implements ClientRequestFilter {

	@Inject
	GatewayRequestContext ctx;

	// @Inject
	// GatewayPolicyEngine policyEngine;

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

		// policyEngine.enforce(ctx);
	}
}
