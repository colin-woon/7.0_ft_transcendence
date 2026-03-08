package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.container.ContainerRequestContext;

@ApplicationScoped
public class PublicPathPolicy implements GatewayPolicy {

	@Override
	public int order() {
		return 100;
	}

	@Override
	public void evaluate(GatewayRequestContext grc, ContainerRequestContext request) {
		// Public paths bypass all downstream auth policies — just return.
		// Route matching and proxying are handled by PublicResource.
		if (!grc.isPublic()) {
			return;
		}
	}
}
