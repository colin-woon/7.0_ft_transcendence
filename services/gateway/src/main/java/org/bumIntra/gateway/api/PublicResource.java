package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.AuthService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

// Public-facing routes — no authentication required.
@Path("/api/public")
public class PublicResource {

	@Inject
	AuthService authService;

	// Temporary endpoint for testing public access
	@GET
	@Path("/ping")
	public Response ping() {
		System.out.println("called public ping");
		return Response.ok("pong from public endpoint").build();
	}

	@GET
	@Path("/auth/login/{provider: .*}")
	public Response proxyPublicLogin(@PathParam("provider") String provider) {
		if (provider.contains("/") || provider.isBlank() || provider.equals(".") || provider.equals("..")) {
			return Response.status(Response.Status.NOT_FOUND).build();
		}
		return authService.proxyGet("api/public/auth/login/" + provider);
	}

	@GET
	@Path("/auth/callback/{provider: .*}")
	public Response proxyPublicCallback(@PathParam("provider") String provider) {
		if (provider.contains("/") || provider.isBlank() || provider.equals(".") || provider.equals("..")) {
			return Response.status(Response.Status.NOT_FOUND).build();
		}
		return authService.proxyGet("api/public/auth/callback/" + provider);
	}

	@POST
	@Path("/{service}/{subpath: .*}")
	public Response proxyPublicPost(@PathParam("service") String service, @PathParam("subpath") String subpath,
			byte[] body) {
		if ("auth".equals(service) && "refresh".equals(subpath)) {
			return authService.proxyPost(buildUrl(service, subpath), body);
		}
		return Response.status(Response.Status.NOT_FOUND).build();
	}

	private String buildUrl(String service, String subpath) {
		// for strict auth callback path OIDC
		if (service.equals("auth") && (subpath.startsWith("callback/") || subpath.startsWith("login/"))) {
			return "api/public/" + service + "/" + subpath;
		}

		if (service.equals("auth")) {
			return service + "/" + subpath;
		}
		return subpath;
	}
}
