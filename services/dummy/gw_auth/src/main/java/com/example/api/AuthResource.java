package com.example.api;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.jboss.logging.Logger;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api")
// @Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

	private static final Logger LOG = Logger.getLogger(AuthResource.class);

	@GET
	@Path("/verify")
	@Produces(MediaType.APPLICATION_JSON)
	public Response verify(@HeaderParam("Authorization") String auth) {

		// Missing header
		if (auth == null || auth.isBlank()) {
			return Response.status(Response.Status.UNAUTHORIZED).build();
		}

		// Simulated auth failures
		if ("401".equals(auth)) {
			return Response.status(Response.Status.UNAUTHORIZED).build();
		}

		if ("403".equals(auth)) {
			return Response.status(Response.Status.FORBIDDEN).build();
		}

		if ("404".equals(auth)) {
			return Response.status(Response.Status.NOT_FOUND).build();
		}

		if ("500".equals(auth)) {
			return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
		}

		if ("BAD_BODY".equals(auth)) {
			System.out.println("Returning bad body");
			return Response.ok("THIS IS NOT JSON").type(MediaType.TEXT_PLAIN).build();
		}

		if ("TIMEOUT".equals(auth)) {
			try {
				Thread.sleep(5000);
			} catch (InterruptedException ignored) {
			}
			return Response.ok().build();
		}

		// ✅ Happy path — return identity facts
		System.out.println("Dummy auth success");
		LOG.info("Dummy auth success");
		return Response.ok(
				new AuthResult(
						"BumUser",
						List.of("USER")))
				.build();
	}

	@GET
	@Path("/headers")
	@Produces(MediaType.APPLICATION_JSON)
	public Response echoHeaders(@Context HttpHeaders headers) {
		// Using TreeMap to keep the output sorted and readable
		Map<String, String> headerMap = new TreeMap<>();

		headers.getRequestHeaders().forEach((key, values) -> {
			// Join multi-value headers with a comma (standard HTTP practice)
			String value = String.join(", ", values);
			headerMap.put(key, value);
		});

		// Print to console for server-side visibility
		System.out.println("--- Incoming Request Headers ---");
		headerMap.forEach((k, v) -> System.out.println(k + ": " + v));

		return Response.ok(headerMap).build();
	}

	@GET
	@Path("/ping")
	@Produces(MediaType.APPLICATION_JSON)
	public Response ping() {
		return Response.ok(Map.of("message", "pong from dummy auth service")).build();
	}
}
