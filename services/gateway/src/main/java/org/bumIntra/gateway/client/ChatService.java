package org.bumIntra.gateway.client;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class ChatService {

	@Inject
	@RestClient
	ChatClient chatClient;

	@Inject
	FaultToleranceServiceCallExecutor ex;

	@Inject
	ServiceCallExecutor sce;

	public Response proxyGet(String path) {
		return ex.execute(() -> chatClient.proxyGet(path));
	}

	public Response proxyPost(String path, byte[] body) {
		return sce.execute(() -> chatClient.proxyPost(path, body));
	}

	public Response proxyDelete(String path) {
		return sce.execute(() -> chatClient.proxyDelete(path));
	}

	public Response proxyPut(String path, byte[] body) {
		return sce.execute(() -> chatClient.proxyPut(path, body));
	}

	public Response proxyPatch(String path, byte[] body) {
		return sce.execute(() -> chatClient.proxyPatch(path, body));
	}
}
