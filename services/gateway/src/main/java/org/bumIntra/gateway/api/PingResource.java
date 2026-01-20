package org.bumIntra.gateway.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("api/ping")
public class PingResource {
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	public String ping() {
		return "pong from gateway";
	}
}
