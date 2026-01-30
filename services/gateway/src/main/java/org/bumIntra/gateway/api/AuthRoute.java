package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;

// Temporary dummy testing, to be updated later

@Path("/api/auth")
public class AuthRoute {
	@Inject
	AuthService authService;

	@GET
	@Path("/ping")
	public Response ping() {
		return authService.ping();
	}

	@GET
	@Path("/verify")
	public Response verify(@HeaderParam("Authorization") String authorization) {
		AuthResult result = authService.verify(authorization);
		return Response.ok(result).build();
	}

	@GET
	@Path("/headers")
	public Response headers(@Context HttpHeaders headers) {
		return authService.headers(headers);
	}
}
