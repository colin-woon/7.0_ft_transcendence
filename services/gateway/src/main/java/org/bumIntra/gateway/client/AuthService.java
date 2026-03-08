package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.FaultToleranceServiceCallExecutor;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class AuthService {

	@Inject
	@RestClient
	AuthClient authClient;

	@Inject
	FaultToleranceServiceCallExecutor ex;

	public Response proxyGet(String path, @Context HttpHeaders headers) {
		return ex.execute(() -> authClient.proxyGet(path, headers));
	}

	public Response proxyPost(String path, byte[] body, @Context HttpHeaders headers) {
		return ex.execute(() -> authClient.proxyPost(path, body, headers));
	}

	public Response proxyDelete(String path, @Context HttpHeaders headers) {
		return ex.execute(() -> authClient.proxyDelete(path, headers));
	}

	public Response proxyPut(String path, byte[] body, @Context HttpHeaders headers) {
		return ex.execute(() -> authClient.proxyPut(path, body, headers));
	}

	public Response proxyPatch(String path, byte[] body, @Context HttpHeaders headers) {
		return ex.execute(() -> authClient.proxyPatch(path, body, headers));
	}
}
