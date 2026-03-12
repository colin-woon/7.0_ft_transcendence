package org.bumIntra.gateway.api;

import java.util.Map;

import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.ChatService;
import org.bumIntra.gateway.client.ForumService;

import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@Path("/api")
public class GatewayResource {

	@Inject
	AuthService authService;

	@Inject
	ForumService forumService;

	@Inject
	ChatService chatService;

	// TODO: temporary endpoint for testing
	@GET
	@Path("/ping")
	public Response ping() {
		System.out.println("insinde ping");
		return Response.ok(Map.of("message", "pong from gateway"))
				.header("X-Internal-Debug", "true")
				.build();
	}

	@GET
	@Path("/{service}/{subpath: .*}")
	public Response proxyGet(@PathParam("service") String service, @PathParam("subpath") String subpath) {
		System.out.println("Proxying GET request to service: " + service + ", subpath: " + subpath);
		return switch (service) {
			case "auth" -> authService.proxyGet(buildPath(service, subpath));
			case "forum" -> forumService.proxyGet(buildPath(service, subpath));
			case "chat" -> chatService.proxyGet(buildPath(service, subpath));
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@POST
	@Path("/{service}/{subpath: .*}")
	public Response proxyPost(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
		return switch (service) {
			case "auth" -> authService.proxyPost(buildPath(service, subpath), body);
			case "forum" -> forumService.proxyPost(buildPath(service, subpath), body);
			case "chat" -> chatService.proxyPost(buildPath(service, subpath), body);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@DELETE
	@Path("/{service}/{subpath: .*}")
	public Response proxyDelete(@PathParam("service") String service, @PathParam("subpath") String subpath) {
		return switch (service) {
			case "auth" -> authService.proxyDelete(buildPath(service, subpath));
			case "forum" -> forumService.proxyDelete(buildPath(service, subpath));
			case "chat" -> chatService.proxyDelete(buildPath(service, subpath));
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PUT
	@Path("/{service}/{subpath: .*}")
	public Response proxyPut(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
		return switch (service) {
			case "auth" -> authService.proxyPut(buildPath(service, subpath), body);
			case "forum" -> forumService.proxyPut(buildPath(service, subpath), body);
			case "chat" -> chatService.proxyPut(buildPath(service, subpath), body);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PATCH
	@Path("/{service}/{subpath: .*}")
	public Response proxyPatch(@PathParam("service") String service, @PathParam("subpath") String subpath,
			byte[] body) {
		return switch (service) {
			case "auth" -> authService.proxyPatch(buildPath(service, subpath), body);
			case "forum" -> forumService.proxyPatch(buildPath(service, subpath), body);
			case "chat" -> chatService.proxyPatch(buildPath(service, subpath), body);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	private String buildPath(String service, String subpath) {
		// TODO: Strip "<service>/" prefix after downstream services adopt normalized
		// base paths.
		// return subpath;
		return service + "/" + subpath;
	}
}
