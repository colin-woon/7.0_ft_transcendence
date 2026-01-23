package org.bumIntra.gateway.client.exec;

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

	public <T> T execute(Supplier<T> serviceCall) {
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

	@Retry(maxRetries = 2, // Total attempts = initial try + 2 retries = 3
			delay = 150, jitter = 50, retryOn = RetryableServiceException.class, abortOn = NonRetryableServiceException.class)

	@CircuitBreaker(requestVolumeThreshold = 4, // Minimum number of requests before CB can trip
			failureRatio = 0.5, // 50% failure rate to trip the CB
			delay = 2000, // Time in ms to wait before attempting to reset the CB
			successThreshold = 2 // Number of successful calls to close the CB
	)

	<T> T executeInner(Supplier<T> serviceCall) {
		try {
			return sce.execute(serviceCall);
		} catch (RetryableServiceException rse) {
			throw (GatewayException) rse.getCause();
		} catch (NonRetryableServiceException nrse) {
			throw (GatewayException) nrse.getCause();
		} catch (GatewayException ge) {
			if (isRetryable(ge.getCode())) {
				throw new RetryableServiceException(ge);
			}
			throw new NonRetryableServiceException(ge);
		}
	}

	private boolean isRetryable(GatewayErrorCode code) {
		return switch (code) {
			case SERVICE_TIMEOUT, SERVICE_UNAVAILABLE, SERVICE_SERVER_ERROR -> true;
			default -> false;
		};
	}
}
