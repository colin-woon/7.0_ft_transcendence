package org.bumIntra.gateway.exception;

public final class GatewayErrorMessageResolver {

	private GatewayErrorMessageResolver() {
		// Private constructor to prevent instantiation
	}

	public static String resolveMessage(GatewayErrorCode gec) {

		if (gec == null) {
			return "Request failed";
		}

		return switch (gec) {

			// ───── Auth / policy ─────
			case AUTH_REQUIRED ->
				"Authentication is required";
			case AUTH_INVALID ->
				"Authentication is invalid";
			case FORBIDDEN ->
				"Access is forbidden";
			case RATE_LIMITED ->
				"Too many requests";

			// ───── Downstream ─────
			case SERVICE_TIMEOUT ->
				"Service timed out";
			case SERVICE_UNAVAILABLE ->
				"Service unavailable";
			case SERVICE_INVALID_RESPONSE ->
				"Service returned an invalid response";
			case SERVICE_CLIENT_ERROR ->
				"Service rejected the request";
			case SERVICE_SERVER_ERROR ->
				"Service failed";

			// ───── Gateway internal ─────
			case GATEWAY_ERROR ->
				"Gateway error occurred";
		};
	}
}
