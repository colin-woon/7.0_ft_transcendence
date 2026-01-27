package org.bumIntra.gateway.filter;

import java.util.List;
import java.util.Set;

import org.bumIntra.gateway.config.GatewayRequestHeaderConfig;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 50) // NOTE: run before authentication to avoid passing unwanted headers to
											// downstream services
public class RequestHeaderAllowListFilter implements ContainerRequestFilter {

	@Inject
	GatewayRequestHeaderConfig grhc;

	@Override
	public void filter(ContainerRequestContext request) {

		final Set<String> allowList = grhc.inboundAllowlistLower();
		final List<String> denyPrefixes = grhc.inboundDenyPrefixesLower();

		var headers = request.getHeaders();

		headers.keySet().stream()
				.filter(ks -> {
					if (ks == null)
						return false;
					String lower = ks.toLowerCase();
					return startsWithAny(lower, denyPrefixes) || !allowList.contains(lower);
				})
				.toList()
				.forEach(headers::remove);

	}

	private static boolean startsWithAny(String str, List<String> prefixes) {
		for (var prefix : prefixes) {
			if (!prefix.isBlank() && str.startsWith(prefix)) {
				return true;
			}
		}
		return false;
	}
}
