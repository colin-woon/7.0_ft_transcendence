package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHORIZATION - 90)
public class RequestRBACFilter implements ContainerRequestFilter {

	@Inject
	GatewayRequestContext grc;

	@Override
	public void filter(ContainerRequestContext request) {

		if (grc.getPath().contains("/admin/") && !grc.getAuthLevel().isAtLeast(AuthLevel.ADMIN)) {
			throw new GatewayException(
					Response.Status.FORBIDDEN,
					GatewayErrorCode.FORBIDDEN,
					"Insufficient permissions");
		}

		// TODO: not sure what happens when users with a valid auth trying to request
		// public login, redirect or block?
	}

}
