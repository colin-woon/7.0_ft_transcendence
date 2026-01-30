package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.client.AuthClient;
import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 50)
public class ServiceAuthFilter implements ContainerRequestFilter {

	@Inject
	GatewayRequestContext grc;

	@Inject
	AuthService authService;

	@Override
	public void filter(ContainerRequestContext request) {

		String authorizationHeader = request.getHeaderString(HttpHeaders.AUTHORIZATION);
		if (authorizationHeader == null || authorizationHeader.isBlank()) {
			throw new GatewayException(Response.Status.UNAUTHORIZED, GatewayErrorCode.AUTH_REQUIRED,
					"Authorization header is missing");
		}

		grc.setAuth(authorizationHeader);

		// AuthService.verify() uses FaultToleranceServiceCallExecutor internally
		// Handles retries, circuit breaking, and error mapping automatically
		AuthResult authResult = authService.verify(authorizationHeader);

		if (authResult == null || authResult.sub() == null || authResult.sub().isBlank()) {
			throw new GatewayException(Response.Status.UNAUTHORIZED, GatewayErrorCode.AUTH_INVALID,
					"Authorization token is invalid");
		}

		grc.setUserId(authResult.sub());
		grc.setRoles(authResult.roles());
		grc.setAuthLevel(AuthLevel.USER);
	}
}
