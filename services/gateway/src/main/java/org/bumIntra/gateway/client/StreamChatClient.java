package org.bumIntra.gateway.client;

import org.bumIntra.gateway.filter.ServiceClientContextFilter;
import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/")
@RegisterRestClient(configKey = "chat-stream-service")
@RegisterProvider(ServiceClientContextFilter.class)
public interface StreamChatClient {

	@GET
	@Path("/{path: .*}")
	@Produces(MediaType.SERVER_SENT_EVENTS)
	Response proxyStream(@Encoded @PathParam("path") String path);
}
