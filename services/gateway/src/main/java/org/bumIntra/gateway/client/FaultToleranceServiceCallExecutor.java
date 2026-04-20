package org.bumIntra.gateway.client;

import java.util.function.Supplier;

import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.exceptions.CircuitBreakerOpenException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class FaultToleranceServiceCallExecutor {

    @Inject
    ServiceCallExecutor sce;

    @Retry(maxRetries = 0,
            delay = 150, jitter = 50, retryOn = RetryableServiceException.class, abortOn = NonRetryableServiceException.class)
    @CircuitBreaker(requestVolumeThreshold = 10,
            failureRatio = 0.6,
            delay = 4000,
            failOn = RetryableServiceException.class,
            skipOn = NonRetryableServiceException.class,
            successThreshold = 2
    )
    public <T> T authExecute(Supplier<T> serviceCall) {
        try {
            return executeInner(serviceCall);
        } catch (RetryableServiceException | NonRetryableServiceException e) {
            throw (GatewayException) e.getCause();
        } catch (CircuitBreakerOpenException cboe) {
            throw new GatewayException(
                    Response.Status.SERVICE_UNAVAILABLE,
                    GatewayErrorCode.SERVICE_UNAVAILABLE,
                    "Service unavailable due to circuit breaker being open: " + cboe.getMessage());
        }
    }

    @Retry(maxRetries = 1,
            delay = 150, jitter = 50, retryOn = RetryableServiceException.class, abortOn = NonRetryableServiceException.class)
    @CircuitBreaker(requestVolumeThreshold = 12,
            failureRatio = 0.7,
            delay = 5000,
            failOn = RetryableServiceException.class,
            skipOn = NonRetryableServiceException.class,
            successThreshold = 2
    )
    public <T> T forumExecute(Supplier<T> serviceCall) {
        try {
            return executeInner(serviceCall);
        } catch (RetryableServiceException | NonRetryableServiceException e) {
            throw (GatewayException) e.getCause();
        } catch (CircuitBreakerOpenException cboe) {
            throw new GatewayException(
                    Response.Status.SERVICE_UNAVAILABLE,
                    GatewayErrorCode.SERVICE_UNAVAILABLE,
                    "Service unavailable due to circuit breaker being open: " + cboe.getMessage());
        }
    }

    @Retry(maxRetries = 1,
            delay = 150, jitter = 50, retryOn = RetryableServiceException.class, abortOn = NonRetryableServiceException.class)
    @CircuitBreaker(requestVolumeThreshold = 12,
            failureRatio = 0.6,
            delay = 4000,
            failOn = RetryableServiceException.class,
            skipOn = NonRetryableServiceException.class,
            successThreshold = 2
    )
    public <T> T chatExecute(Supplier<T> serviceCall) {
        try {
            return executeInner(serviceCall);
        } catch (RetryableServiceException | NonRetryableServiceException e) {
            throw (GatewayException) e.getCause();
        } catch (CircuitBreakerOpenException cboe) {
            throw new GatewayException(
                    Response.Status.SERVICE_UNAVAILABLE,
                    GatewayErrorCode.SERVICE_UNAVAILABLE,
                    "Service unavailable due to circuit breaker being open: " + cboe.getMessage());
        }
    }

    <T> T executeInner(Supplier<T> serviceCall) {
        try {
            return sce.execute(serviceCall);
        } catch (RetryableServiceException | NonRetryableServiceException e) {
            throw (GatewayException) e.getCause();
        } catch (GatewayException ge) {
            if (isRetryable(ge.getCode())) {
                throw new RetryableServiceException(ge);
            }
            throw new NonRetryableServiceException(ge);
        }
    }

    private boolean isRetryable(GatewayErrorCode code) {
        return switch (code) {
            case SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_SERVER_ERROR, SERVICE_INVALID_RESPONSE -> true;
            default -> false;
        };
    }
}
