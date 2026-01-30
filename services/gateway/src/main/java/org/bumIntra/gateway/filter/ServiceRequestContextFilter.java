package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.policy.GatewayPolicyEngine;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.IdentityHeaders;

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

		request.getHeaders().putSingle(IdentityHeaders.X_AUTH_LEVEL, ctx.getAuthLevel().name());

		if (ctx.getAuthLevel() == AuthLevel.USER) {

			ctx.getUserId().ifPresent(userId -> {
				request.getHeaders().putSingle(IdentityHeaders.X_USER_ID, userId);
			});

			ctx.getRoles().ifPresent(roles -> {
				request.getHeaders().putSingle(IdentityHeaders.X_USER_ROLES, String.join(",", roles));
			});
		}

		// service identity with mTLS
	}
}
