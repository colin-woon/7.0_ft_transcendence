package org.bumIntra.gateway.client;

import org.bumIntra.gateway.filter.ServiceClientContextFilter;
import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/")
@RegisterRestClient(configKey = "chat-service")
@RegisterProvider(ServiceClientContextFilter.class)
public interface StreamChatClient {

	@GET
	@Path("/{path: .*}")
	Response proxyStream(@Encoded @PathParam("path") String path);
}
