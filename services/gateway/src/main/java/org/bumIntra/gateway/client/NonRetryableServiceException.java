package org.bumIntra.gateway.client;

public class NonRetryableServiceException extends RuntimeException {
	public NonRetryableServiceException(Throwable cause) {
		super(cause);
	}
}
