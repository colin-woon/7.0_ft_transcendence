package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.exec.FaultToleranceServiceCallExecutor;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthService {

	@Inject
	@RestClient
	AuthClient authClient;

	@Inject
	FaultToleranceServiceCallExecutor executor;

	public AuthResult verify(String authorization) {
		return executor.execute(() -> authClient.verify(authorization));
	}
}
