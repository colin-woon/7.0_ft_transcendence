package org.bumIntra.gateway.client;

import org.bumIntra.gateway.filter.ServiceClientContextFilter;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Encoded;
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
@RegisterProvider(ServiceClientContextFilter.class)
public interface AuthClient {

	@GET
	@Path("/{path: .*}")
	Response proxyGet(@Encoded @PathParam("path") String path);

	@POST
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPost(@Encoded @PathParam("path") String path, byte[] body);

	@DELETE
	@Path("/{path: .*}")
	Response proxyDelete(@Encoded @PathParam("path") String path);

	@PUT
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPut(@Encoded @PathParam("path") String path, byte[] body);

	@PATCH
	@Path("/{path: .*}")
	// @Consumes(MediaType.APPLICATION_JSON)
	// @Produces(MediaType.APPLICATION_JSON)
	Response proxyPatch(@Encoded @PathParam("path") String path, byte[] body);

}
