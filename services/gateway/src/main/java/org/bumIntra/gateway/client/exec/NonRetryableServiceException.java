package org.bumIntra.gateway.client.exec;

public class NonRetryableServiceException extends RuntimeException {
	public NonRetryableServiceException(Throwable cause) {
		super(cause);
	}
}
