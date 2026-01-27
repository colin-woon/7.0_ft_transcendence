package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("api/ping")
public class PingResource {
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	public Response ping() {

		return Response.ok("pong from gateway")
				.header("X-Internal-Debug", "true")
				.build();
	}
}
