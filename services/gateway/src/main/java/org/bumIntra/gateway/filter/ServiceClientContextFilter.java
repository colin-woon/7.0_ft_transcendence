package org.bumIntra.gateway.filter;

import java.util.List;

import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.ext.Provider;

/**
 * Outbound ClientRequestFilter — runs just before the REST client sends the
 * HTTP request to a downstream service. Injects identity and tracing headers
 * from the current GatewayRequestContext so every downstream service receives
 * a consistent set of X-* headers regardless of which proxy method was called.
 *
 * This is the correct hook for header injection: ContainerRequestFilters /
 * ServiceHeaderPolicy run server-side and their mutations never travel to the
 * outbound REST client request.
 *
 * Register on each REST client interface via @RegisterProvider.
 */
@Provider
@Priority(Priorities.HEADER_DECORATOR - 100)
public class ServiceClientContextFilter implements ClientRequestFilter {

	@Inject
	GatewayRequestContext grc;

	@Override
	public void filter(ClientRequestContext request) {

		if (grc.getQueryParams() != null && !grc.getQueryParams().isEmpty()) {

			var uriBuilder = UriBuilder.fromUri(request.getUri());

			grc.getQueryParams().forEach((k, v) -> {
				uriBuilder.queryParam(k, v.toArray());
			});

			request.setUri(uriBuilder.build());
		}

		// System.out.println("ClientRequestContext URI: " + request.getUri());
		// request.getHeaders().forEach((k, v) -> {
		// System.out.println("ClientRequestContext header: " + k + " = " + v);
		// });
		//
		// System.out.println("GatewayRequestContext headers: ");
		// grc.getHeaders().forEach((k, v) -> {
		// System.out.println(k + " = " + v);
		// });

		if (grc.getHeaders() != null) {
			// Propagate essential headers safely
			var headersToPropagate = List.of(
					HttpHeaders.COOKIE,
					HttpHeaders.CONTENT_TYPE,
					HttpHeaders.ACCEPT,
					HttpHeaders.AUTHORIZATION);

			for (String headerName : headersToPropagate) {
				String headerValue = grc.getHeaders().getFirst(headerName);
				if (headerValue != null) {
					request.getHeaders().putSingle(headerName, headerValue);
				}
			}
		}

		if (grc.getRequestId() != null && !grc.getRequestId().isBlank()) {
			request.getHeaders().putSingle(IdentityHeaders.REQUEST_ID, grc.getRequestId());
		}

		request.getHeaders().putSingle(IdentityHeaders.AUTH_LEVEL, grc.getAuthLevel().name());

		if (grc.getUserId().isPresent()) {
			request.getHeaders().putSingle(IdentityHeaders.USER_ID, grc.getUserId().get());
		}

		var roles = grc.getRoles();
		if (roles != null && !roles.isEmpty()) {
			request.getHeaders().putSingle(IdentityHeaders.USER_ROLES,
					String.join(",", roles));
		}

		if (grc.isInternal()) {
			request.getHeaders().putSingle(IdentityHeaders.INTERNAL_REQUEST, "true");
		}

		if (grc.getRealIp() != null && !grc.getRealIp().isBlank()) {
			request.getHeaders().putSingle(IdentityHeaders.REAL_IP, grc.getRealIp());
		}
		if (grc.getForwardedFor() != null && !grc.getForwardedFor().isBlank()) {
			request.getHeaders().putSingle(IdentityHeaders.FORWARDED_FOR, grc.getForwardedFor());
		}
		if (grc.getForwardedHost() != null && !grc.getForwardedHost().isBlank()) {
			request.getHeaders().putSingle(IdentityHeaders.FORWARDED_HOST, grc.getForwardedHost());
		}
		if (grc.getForwardedProto() != null && !grc.getForwardedProto().isBlank()) {
			request.getHeaders().putSingle(IdentityHeaders.FORWARDED_PROTO, grc.getForwardedProto());
		}
	}
}
