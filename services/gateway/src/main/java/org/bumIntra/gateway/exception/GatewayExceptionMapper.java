package org.bumIntra.gateway.exception;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import static org.bumIntra.gateway.exception.GatewayErrorMessageResolver.resolveMessage;

@Provider
public class GatewayExceptionMapper implements ExceptionMapper<GatewayException> {

	@Inject
	GatewayRequestContext grc;

	@Override
	public Response toResponse(GatewayException ge) {

		grc.setError(ge.getCode().toString(), ge.getStatus().getStatusCode());

		GatewayErrorResponse body = new GatewayErrorResponse(
				ge.getStatus().getStatusCode(),
				ge.getStatus().name(),
				ge.getCode(),
				resolveMessage(ge.getCode()),
				grc.getRequestId());

		var responseBuilder = Response
				.status(ge.getStatus())
				.type(MediaType.APPLICATION_JSON)
				.entity(body);

		ge.getHeaders().forEach(responseBuilder::header);
		return responseBuilder.build();
	}
}
