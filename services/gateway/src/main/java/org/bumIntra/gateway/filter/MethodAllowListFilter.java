package org.bumIntra.gateway.filter;

import java.util.Set;

import org.bumIntra.gateway.config.GatewayMethodConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 100) // NOTE: run before authentication to avoid passing unwanted methods to
											// downstream
// services
public class MethodAllowListFilter implements ContainerRequestFilter {

	@Inject
	GatewayMethodConfig gmc;

	@Override
	public void filter(ContainerRequestContext request) {

		String method = request.getMethod();
		if (method == null) {
			throw new GatewayException(
					Response.Status.METHOD_NOT_ALLOWED,
					GatewayErrorCode.FORBIDDEN,
					"Method not allowed: null");
		}

		Set<String> allowed = gmc.allowedMethodsUpper();
		String upper = method.toUpperCase().trim();

		if (!allowed.contains(upper)) {
			throw new GatewayException(
					Response.Status.METHOD_NOT_ALLOWED,
					GatewayErrorCode.FORBIDDEN,
					"Method not allowed: " + upper);
			// .withHeader("Allow", String.join(", ", allowed));
			// TODO: above line to be uncommented when JAX-RS supports setting Allow header
			// in 405 responses
		}
	}
}
