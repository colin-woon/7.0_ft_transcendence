package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/")
@RegisterRestClient(configKey = "auth-service")
// @RegisterProvider(ServiceAuthFilter.class)
public interface AuthClient {

	@GET
	@Path("/{path: .*}")
	Response proxyGet(@PathParam("path") String path, @Context HttpHeaders headers);

	@POST
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPost(@PathParam("path") String path, byte[] body, @Context HttpHeaders headers);

	@DELETE
	@Path("/{path: .*}")
	Response proxyDelete(@PathParam("path") String path, @Context HttpHeaders headers);

	@PUT
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPut(@PathParam("path") String path, byte[] body, @Context HttpHeaders headers);

	@PATCH
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPatch(@PathParam("path") String path, byte[] body, @Context HttpHeaders headers);

}
