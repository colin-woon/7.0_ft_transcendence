package org.bumIntra.gateway.filter;

import java.util.List;

import org.bumIntra.gateway.config.GatewayResponseHeaderConfig;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.HEADER_DECORATOR + 50) // Run after other header decorators
public class ResponseHeaderStripFilter implements ContainerResponseFilter {

	@Inject
	GatewayResponseHeaderConfig grhc;

	@Override
	public void filter(ContainerRequestContext request, ContainerResponseContext response) {

		List<String> stripPrefixes = grhc.stripPrefixesLower();
		List<String> stripHeaders = grhc.stripHeadersLower();

		var headers = response.getHeaders();

		headers.keySet().stream()
				.filter(ks -> {
					if (ks == null)
						return false;
					String lower = ks.toLowerCase();
					return stripHeaders.contains(lower) || startsWithAny(lower, stripPrefixes);
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
