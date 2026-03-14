package org.bumIntra.gateway.client;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class StreamChatService {

	@Inject
	@RestClient
	StreamChatClient streamChatClient;

	public Response proxyStream(String path) {
		return streamChatClient.proxyStream(path);
	}
}
