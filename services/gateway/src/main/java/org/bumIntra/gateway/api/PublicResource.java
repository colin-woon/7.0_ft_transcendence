package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.AuthService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/api/public")
public class PublicResource {

	@Inject
	AuthService authService;

	@GET
	@Path("/login/google")
	public Response login() {
		return authService.loginGoogle();
	}

	@GET
	@Path("/login/intra")
	public Response loginIntra() {
		return authService.loginIntra();
	}
}
