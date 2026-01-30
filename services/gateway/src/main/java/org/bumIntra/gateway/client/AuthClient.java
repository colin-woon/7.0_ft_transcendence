package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Temporary dummy testing, to be updated later

@Path("/api")
@RegisterRestClient(configKey = "auth-service")
// @RegisterProvider(ServiceAuthFilter.class)
public interface AuthClient {
	@GET
	@Path("/ping")
	Response ping();

	@GET
	@Path("/verify")
	@Produces(MediaType.APPLICATION_JSON)
	// @Consumes("application/json")
	AuthResult verify(@HeaderParam("Authorization") String authorization);

	@GET
	@Path("/headers")
	Response headers(@Context HttpHeaders headers);
}
