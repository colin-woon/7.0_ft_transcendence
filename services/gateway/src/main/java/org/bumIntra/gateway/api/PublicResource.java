package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.AuthService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

// Public-facing routes — no authentication required.
// Matched by gateway.auth.public-paths=/api/public/ in application.properties.
// Only GET is exposed: the OAuth flow (login + callback) is entirely redirect-based.
@Path("/api/public")
public class PublicResource {

	@Inject
	AuthService authService;

	@GET
	@Path("/{service}/{subpath: .*}")
	public Response proxyPublicGet(@PathParam("service") String service,
			@PathParam("subpath") String subpath,
			@Context HttpHeaders headers) {
		return switch (service) {
			case "auth" -> authService.proxyGet(service + "/" + subpath, headers);
			default -> Response.status(Response.Status.NOT_FOUND).build();
		};
	}
}
