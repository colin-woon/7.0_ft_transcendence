package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.container.ContainerRequestContext;

@ApplicationScoped
public class InternalPathPolicy implements GatewayPolicy {

	@Override
	public int order() {
		return 110;
	}

	@Override
	public void evaluate(GatewayRequestContext grc, ContainerRequestContext request) {

		if (grc.isPublic() || !grc.isInternal()) {
			return;
		}

	}
}
