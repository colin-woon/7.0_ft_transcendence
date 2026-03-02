package org.bumIntra.gateway.client;

public class RetryableServiceException extends RuntimeException {
	public RetryableServiceException(Throwable cause) {
		super(cause);
	}
}
