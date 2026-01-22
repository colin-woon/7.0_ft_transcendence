package org.bumIntra.gateway.filter;

import org.jboss.logging.MDC;

import java.util.UUID;

import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.exception.AuthRequiredException;
import org.bumIntra.gateway.policy.GatewayPolicyEngine;

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
	GatewayRequestContext ctx;

	@Inject
	GatewayPolicyEngine policyEngine;

	@Override
	public void filter(ContainerRequestContext request) {

		String requestId = request.getHeaderString("X-Request-Id");

		if (requestId == null || requestId.isBlank()) {
			requestId = UUID.randomUUID().toString();
		}

		ctx.setRequestId(requestId);

		// MDC - Mapped Diagnostic Context for logging
		MDC.put("requestId", requestId);

		ctx.setAuth(request.getHeaderString("Authorization"));

		policyEngine.enforce(ctx);
	}
}
