package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.filter.ServiceAuthFilter;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Temporary dummy testing, to be updated later

@Path("/api")
@RegisterRestClient(configKey = "auth-service")
@RegisterProvider(ServiceAuthFilter.class)
public interface AuthClient {
	@GET
	@Path("/ping")
	Response ping();

	@GET
	@Path("/verify")
	// @Consumes("application/json")
	AuthResult verify();
}
