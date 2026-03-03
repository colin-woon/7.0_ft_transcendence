package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.policy.GatewayPolicyEngine;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 40) // Run after ServiceAuthFilter (-50) so policies have access to userId/roles
public class PolicyEngineFilter implements ContainerRequestFilter {

	@Inject
	GatewayRequestContext grc;

	@Inject
	GatewayPolicyEngine policyEngine;

	@Override
	public void filter(ContainerRequestContext request) {

		policyEngine.enforce(grc);
	}
}
