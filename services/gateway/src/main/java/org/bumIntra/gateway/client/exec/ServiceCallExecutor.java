package org.bumIntra.gateway.client.exec;

import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class ServiceCallExecutor {

	public <T> T execute(Supplier<T> serviceCall) {
		try {
			return serviceCall.get();
		} catch (WebApplicationException e) {
			throw handleHttpFailure(e);
		} catch (ProcessingException e) {
			throw handleProcessingFailure(e);
		}
	}

	private GatewayException handleHttpFailure(WebApplicationException e) {
		int status = e.getResponse().getStatus();

		if (status >= 400 && status < 500) {
			return new GatewayException(
					Response.Status.fromStatusCode(status),
					GatewayErrorCode.SERVICE_CLIENT_ERROR,
					"Service client error: " + e.getMessage());
		}

		return new GatewayException(
				Response.Status.BAD_GATEWAY,
				GatewayErrorCode.SERVICE_SERVER_ERROR,
				"Service server error: " + e.getMessage());
	}

	private GatewayException handleProcessingFailure(ProcessingException e) {

		Throwable cause = e.getCause();

		if (cause instanceof TimeoutException) {
			return new GatewayException(
					Response.Status.GATEWAY_TIMEOUT,
					GatewayErrorCode.SERVICE_TIMEOUT,
					"Service timeout: " + e.getMessage());
		}

		return new GatewayException(
				Response.Status.SERVICE_UNAVAILABLE,
				GatewayErrorCode.SERVICE_UNAVAILABLE,
				"Service unavailable: " + e.getMessage());
	}
}
