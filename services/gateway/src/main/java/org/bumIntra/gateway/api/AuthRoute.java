package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import org.bumIntra.gateway.client.AuthClient;
import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.exec.FaultToleranceServiceCallExecutor;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.eclipse.microprofile.rest.client.inject.RestClient;

// Temporary dummy testing, to be updated later

@Path("/api/auth")
public class AuthRoute {
	@Inject
	@RestClient
	AuthClient authClient;

	@Inject
	AuthService authService;

	@Inject
	GatewayRequestContext ctx;

	@Inject
	FaultToleranceServiceCallExecutor ex;

	@GET
	@Path("/ping")
	public Response ping() {
		// Direct ping for health check - uses executor
		return ex.execute(() -> authClient.ping());
	}

	@GET
	@Path("/verify")
	public Response verify(@HeaderParam("Authorization") String authorization) {
		// Use AuthService which internally uses executor - no double wrapping
		AuthResult result = authService.verify(authorization);
		return Response.ok(result).build();
	}
}
