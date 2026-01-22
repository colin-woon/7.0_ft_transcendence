package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import org.bumIntra.gateway.client.AuthClient;
import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.exec.ServiceCallExecutor;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.eclipse.microprofile.rest.client.inject.RestClient;

// Temporary dummy testing, to be updated later

@Path("/api/auth")
public class AuthRoute {
	@Inject
	@RestClient
	AuthClient authClient;

	@Inject
	GatewayRequestContext ctx;

	@Inject
	ServiceCallExecutor ex;

	@GET
	@Path("/ping")
	public Response ping() {
		return ex.execute(() -> authClient.ping());
	}

	@GET
	@Path("/verify")
	public Response verify() {
		AuthResult result = ex.execute(() -> authClient.verify());
		return Response.ok(result).build();
	}
}
