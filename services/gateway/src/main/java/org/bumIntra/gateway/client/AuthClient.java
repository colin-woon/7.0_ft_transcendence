package org.bumIntra.gateway.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Temporary dummy testing, to be updated later

@Path("/api")
@RegisterRestClient
public interface AuthClient {
	@GET
	@Path("/ping")
	Response ping();
}
