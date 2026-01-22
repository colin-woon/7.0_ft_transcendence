package org.bumIntra.gateway.exception;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class GatewayExceptionMapper implements ExceptionMapper<GatewayException> {

	@Inject
	GatewayRequestContext ctx;

	@Override
	public Response toResponse(GatewayException e) {

		ctx.setError(e.getCode(), e.getStatus().getStatusCode());

		GatewayErrorResponse body = new GatewayErrorResponse(
				e.getStatus().getStatusCode(),
				e.getStatus().name(),
				e.getCode(),
				e.getMessage(),
				ctx.getRequestId());

		return Response
				.status(e.getStatus())
				.type(MediaType.APPLICATION_JSON)
				.entity(body)
				.build();
	}
}
