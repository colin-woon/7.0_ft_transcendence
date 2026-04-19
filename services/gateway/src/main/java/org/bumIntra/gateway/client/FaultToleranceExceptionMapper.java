package org.bumIntra.gateway.client;

import java.util.function.Supplier;

import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.eclipse.microprofile.faulttolerance.exceptions.CircuitBreakerOpenException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class FaultToleranceExceptionMapper {

    public <T> T execute(Supplier<T> call) {
        try {
            return call.get();
        } catch (RetryableServiceException | NonRetryableServiceException e) {
            throw (GatewayException) e.getCause();
        } catch (CircuitBreakerOpenException cboe) {
            throw new GatewayException(
                    Response.Status.SERVICE_UNAVAILABLE,
                    GatewayErrorCode.SERVICE_UNAVAILABLE,
                    "Service unavailable due to circuit breaker being open: " + cboe.getMessage());
        }
    }
}
