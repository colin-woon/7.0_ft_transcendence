package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.exec.FaultToleranceServiceCallExecutor;
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

	public Response ping() {
		return ex.execute(() -> authClient.ping());
	}

	public AuthResult verify(String authorization) {
		return ex.execute(() -> authClient.verify(authorization));

	}

	public Response headers(@Context HttpHeaders headers) {
		return ex.execute(() -> authClient.headers(headers));
	}
}
