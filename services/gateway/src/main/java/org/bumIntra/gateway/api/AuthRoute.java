package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import org.bumIntra.gateway.client.AuthClient;
import org.eclipse.microprofile.rest.client.inject.RestClient;

// Temporary dummy testing, to be updated later

@Path("/api/auth")
public class AuthRoute {
	@Inject
	@RestClient
	AuthClient authClient;

	@GET
	@Path("/ping")
	public Response ping() {
		return authClient.ping();
	}
}
