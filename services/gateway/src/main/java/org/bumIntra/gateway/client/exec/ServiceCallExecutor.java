package org.bumIntra.gateway.client.exec;

import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;

import com.fasterxml.jackson.core.JsonProcessingException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.client.ResponseProcessingException;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class ServiceCallExecutor {

	public <T> T execute(Supplier<T> serviceCall) {
		try {
			return serviceCall.get();
		} catch (WebApplicationException wae) {
			throw handleHttpFailure(wae);
		} catch (ProcessingException pe) {
			throw handleProcessingFailure(pe);
		}
	}

	private GatewayException handleHttpFailure(WebApplicationException wae) {
		int status = wae.getResponse().getStatus();

		if (status >= 400 && status < 500) {
			return new GatewayException(
					Response.Status.fromStatusCode(status),
					GatewayErrorCode.SERVICE_CLIENT_ERROR,
					"Service client error: " + wae.getMessage());
		}

		return new GatewayException(
				Response.Status.BAD_GATEWAY,
				GatewayErrorCode.SERVICE_SERVER_ERROR,
				"Service server error: " + wae.getMessage());
	}

	private GatewayException handleProcessingFailure(ProcessingException pe) {

		Throwable cause = pe.getCause();
		String message = pe.getMessage();

		// Check for timeout
		if (cause instanceof TimeoutException) {
			return new GatewayException(
					Response.Status.GATEWAY_TIMEOUT,
					GatewayErrorCode.SERVICE_TIMEOUT,
					"Service timeout: " + message);
		}

		// Check for response deserialization errors (JSON/content-type mismatch)
		// MicroProfile REST Client throws ProcessingException with specific message
		// patterns
		if (message != null &&
				(message.contains("could not be mapped") ||
						message.contains("media type") ||
						message.contains("JSON") ||
						message.contains("deserialize"))) {
			return new GatewayException(
					Response.Status.BAD_GATEWAY,
					GatewayErrorCode.SERVICE_INVALID_RESPONSE,
					"Invalid response from service: " + message);
		}

		// Generic processing error (connection, network, etc.)
		return new GatewayException(
				Response.Status.SERVICE_UNAVAILABLE,
				GatewayErrorCode.SERVICE_UNAVAILABLE,
				"Service unavailable: " + message);
	}
}
