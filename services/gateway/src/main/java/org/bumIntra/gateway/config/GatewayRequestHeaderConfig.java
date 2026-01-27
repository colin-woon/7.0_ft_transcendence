package org.bumIntra.gateway.config;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.config.headers")
public interface GatewayRequestHeaderConfig {

	@WithDefault("accept, accept-language, content-type, authorization, user-agent, x-request-id")
	List<String> requestAllowList();

	@WithDefault("x-internal-, x-bumintra-, x-envoy-, x-forwarded-client-cert")
	List<String> requestDenyPrefixes();

	default Set<String> inboundAllowlistLower() {
		return requestAllowList()
				.stream()
				.filter(s -> s != null && !s.isBlank())
				.map(s -> s.trim().toLowerCase())
				.collect(Collectors.toUnmodifiableSet());
	}

	default List<String> inboundDenyPrefixesLower() {
		return requestDenyPrefixes()
				.stream()
				.filter(s -> s != null && !s.isBlank())
				.map(s -> s.trim().toLowerCase())
				.toList();
	}
}
