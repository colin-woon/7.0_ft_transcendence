package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.AuthService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

// Public-facing routes — no authentication required.
@Path("/api/public")
public class PublicResource {

	@Inject
	AuthService authService;

	@GET
	@Path("/{service}/{subpath: .*}")
	public Response proxyPublicGet(@PathParam("service") String service,
			@PathParam("subpath") String subpath) {
		if ("auth".equals(service) && (subpath.startsWith("login/") || subpath.startsWith("callback/"))) {
			return authService.proxyGet(buildUrl(service, subpath));
		}
		return Response.status(Response.Status.NOT_FOUND).build();
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
		if (service.equals("auth") && subpath.startsWith("callback/")) {
			return "api/public/" + service + "/" + subpath;
		}
		return service + "/" + subpath;
	}
}
