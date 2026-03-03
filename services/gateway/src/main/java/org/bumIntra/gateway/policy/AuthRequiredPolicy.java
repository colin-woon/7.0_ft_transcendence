package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class AuthRequiredPolicy implements GatewayPolicy {

	@Inject
	GatewayAuthConfig authConfig;

	@Override
	public int order() {
		return 100;
	}

	@Override
	public void evaluate(GatewayRequestContext ctx) {

		if (authConfig.required() && (ctx.getAuth() == null || ctx.getAuth().isBlank())) {
			throw new GatewayException(
					Response.Status.UNAUTHORIZED,
					GatewayErrorCode.AUTH_REQUIRED,
					"Authentication header is required");
		}
	}
}
