package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.container.ContainerRequestContext;

@ApplicationScoped
public class ServiceHeaderPolicy implements GatewayPolicy {

	@Override
	public int order() {
		return 200;
	}

	@Override
	public void evaluate(GatewayRequestContext grc, ContainerRequestContext request) {

		grc.getUserId().ifPresent(id -> request.getHeaders().putSingle("X-Intra-User-Id", id));

		if (grc.getRoles() != null && !grc.getRoles().isEmpty()) {
			request.getHeaders().putSingle("X-Intra-Roles", String.join(",", grc.getRoles()));
		}

		if (grc.isInternal()) {
			request.getHeaders().putSingle("X-Intra-Internal", "true");
		}

		request.getHeaders().putSingle("X-Intra-Auth-Level", grc.getAuthLevel().name());

	}
}
