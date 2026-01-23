package org.bumIntra.gateway.client.exec;

public class RetryableServiceException extends RuntimeException {
	public RetryableServiceException(Throwable cause) {
		super(cause);
	}
}
