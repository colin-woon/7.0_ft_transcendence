package org.bumIntra.gateway.exception;

import static org.bumIntra.gateway.exception.GatewayErrorMessageResolver.resolveMessage;

import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.bumIntra.gateway.security.GatewayRequestContext;

@Provider
public class GatewayExceptionMapper implements ExceptionMapper<GatewayException> {

    @Inject
    GatewayRequestContext grc;

    @Override
    public Response toResponse(GatewayException ge) {

        grc.setError(ge.getCode().toString(), ge.getStatus().getStatusCode());

        String msg = ge.getCode() == GatewayErrorCode.SERVICE_CLIENT_ERROR
                && ge.getMessage() != null
                && !ge.getMessage().isBlank()
                        ? ge.getMessage()
                        : resolveMessage(ge.getCode());

        GatewayErrorResponse body = new GatewayErrorResponse(
                ge.getStatus().getStatusCode(),
                ge.getStatus().name(),
                ge.getCode(),
                msg,
                grc.getRequestId());

        var responseBuilder = Response.status(ge.getStatus()).type(MediaType.APPLICATION_JSON).entity(body);

        ge.getHeaders().forEach(responseBuilder::header);
        return responseBuilder.build();
    }
}
