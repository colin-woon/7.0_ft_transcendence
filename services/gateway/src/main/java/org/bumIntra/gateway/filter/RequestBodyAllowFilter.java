package org.bumIntra.gateway.filter;

import org.bumIntra.gateway.config.GatewayRequestBodyConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 79)
public class RequestBodyAllowFilter implements ContainerRequestFilter {

    @Inject
    GatewayRequestContext grc;

    @Inject
    GatewayRequestBodyConfig grbc;

    @Override
    public void filter(ContainerRequestContext request) {
        // check methods if its POST, PUT, PATCH, DELETE, etc. that may have body

        var method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        var contentLength = request.getHeaderString("Content-Length");
        if (contentLength != null) {
            try {
                long length = Long.parseLong(contentLength);
                var maxSize = grbc.getMaxSizeForPath(grc.getPath());
                if (maxSize != null && length > maxSize.asLongValue()) {
                    throw new GatewayException(Response.Status.REQUEST_ENTITY_TOO_LARGE,
                            GatewayErrorCode.PAYLOAD_TOO_LARGE, "Request body too large");
                }
            } catch (NumberFormatException e) {
                throw new GatewayException(Response.Status.BAD_REQUEST, GatewayErrorCode.GATEWAY_ERROR,
                        "Invalid Content-Length header");
            }
        }

    }
}
