package org.bumIntra.gateway.api;

import java.util.Map;

import org.bumIntra.gateway.client.AuthService;

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

	// @Inject
	// ForumService forumService;

	// @Inject
	// ChatService chatService;

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
	public Response proxyGet(@PathParam("service") String service, @PathParam("subpath") String subpath,
			@Context HttpHeaders headers) {
		System.out.println("Proxying GET request to service: " + service + ", subpath: " + subpath);
		return switch (service) {
			case "auth" -> authService.proxyGet(service + "/" + subpath, headers);
			// case "forum" -> forumService.proxyGet(service + "/" + subpath, headers);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@POST
	@Path("/{service}/{subpath: .*}")
	public Response proxyPost(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body,
			@Context HttpHeaders headers) {
		return switch (service) {
			case "auth" -> authService.proxyPost(service + "/" + subpath, body, headers);
			// case "forum" -> forumService.proxyPost(service + "/" + subpath, body, headers);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@DELETE
	@Path("/{service}/{subpath: .*}")
	public Response proxyDelete(@PathParam("service") String service, @PathParam("subpath") String subpath,
			@Context HttpHeaders headers) {
		return switch (service) {
			case "auth" -> authService.proxyDelete(service + "/" + subpath, headers);
			// case "forum" -> forumService.proxyDelete(service + "/" + subpath, headers);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PUT
	@Path("/{service}/{subpath: .*}")
	public Response proxyPut(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body,
			@Context HttpHeaders headers) {
		return switch (service) {
			case "auth" -> authService.proxyPut(service + "/" + subpath, body, headers);
			// case "forum" -> forumService.proxyPut(service + "/" + subpath, body, headers);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PATCH
	@Path("/{service}/{subpath: .*}")
	public Response proxyPatch(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body,
			@Context HttpHeaders headers) {
		return switch (service) {
			case "auth" -> authService.proxyPatch(service + "/" + subpath, body, headers);
			// case "forum" -> forumService.proxyPatch(service + "/" + subpath, body, headers);
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}
}
