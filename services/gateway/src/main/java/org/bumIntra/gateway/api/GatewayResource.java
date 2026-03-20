package org.bumIntra.gateway.api;

import java.util.Map;

import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.ChatService;
import org.bumIntra.gateway.client.ForumService;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/api")
public class GatewayResource {

	private static final String AUTH_SERVICE = "auth-service";
	private static final String FORUM_SERVICE = "forum-service";
	private static final String CHAT_SERVICE = "chat-service";

	@Inject
	AuthService authService;

	@Inject
	ForumService forumService;

	@Inject
	ChatService chatService;

	@Inject
	GatewayRequestContext grc;

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
			case "auth" -> {
				grc.setServiceName(AUTH_SERVICE);
				yield authService.proxyGet(buildPath(service, subpath));
			}
			case "forum" -> {
				grc.setServiceName(FORUM_SERVICE);
				yield forumService.proxyGet(buildPath(service, subpath));
			}
			case "chat" -> {
				grc.setServiceName(CHAT_SERVICE);
				yield chatService.proxyGet(buildPath(service, subpath));
			}
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@POST
	@Path("/{service}/{subpath: .*}")
	public Response proxyPost(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
		return switch (service) {
			case "auth" -> {
				grc.setServiceName(AUTH_SERVICE);
				yield authService.proxyPost(buildPath(service, subpath), body);
			}
			case "forum" -> {
				grc.setServiceName(FORUM_SERVICE);
				yield forumService.proxyPost(buildPath(service, subpath), body);
			}
			case "chat" -> {
				grc.setServiceName(CHAT_SERVICE);
				yield chatService.proxyPost(buildPath(service, subpath), body);
			}
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@DELETE
	@Path("/{service}/{subpath: .*}")
	public Response proxyDelete(@PathParam("service") String service, @PathParam("subpath") String subpath) {
		return switch (service) {
			case "auth" -> {
				grc.setServiceName(AUTH_SERVICE);
				yield authService.proxyDelete(buildPath(service, subpath));
			}
			case "forum" -> {
				grc.setServiceName(FORUM_SERVICE);
				yield forumService.proxyDelete(buildPath(service, subpath));
			}
			case "chat" -> {
				grc.setServiceName(CHAT_SERVICE);
				yield chatService.proxyDelete(buildPath(service, subpath));
			}
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PUT
	@Path("/{service}/{subpath: .*}")
	public Response proxyPut(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
		return switch (service) {
			case "auth" -> {
				grc.setServiceName(AUTH_SERVICE);
				yield authService.proxyPut(buildPath(service, subpath), body);
			}
			case "forum" -> {
				grc.setServiceName(FORUM_SERVICE);
				yield forumService.proxyPut(buildPath(service, subpath), body);
			}
			case "chat" -> {
				grc.setServiceName(CHAT_SERVICE);
				yield chatService.proxyPut(buildPath(service, subpath), body);
			}
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	@PATCH
	@Path("/{service}/{subpath: .*}")
	public Response proxyPatch(@PathParam("service") String service, @PathParam("subpath") String subpath,
			byte[] body) {
		return switch (service) {
			case "auth" -> {
				grc.setServiceName(AUTH_SERVICE);
				yield authService.proxyPatch(buildPath(service, subpath), body);
			}
			case "forum" -> {
				grc.setServiceName(FORUM_SERVICE);
				yield forumService.proxyPatch(buildPath(service, subpath), body);
			}
			case "chat" -> {
				grc.setServiceName(CHAT_SERVICE);
				yield chatService.proxyPatch(buildPath(service, subpath), body);
			}
			default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
		};
	}

	private String buildPath(String service, String subpath) {
		if (service.equals("auth")) {
			return service + "/" + subpath;
		}
		return subpath;
	}
}
