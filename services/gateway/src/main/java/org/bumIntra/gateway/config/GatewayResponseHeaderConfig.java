package org.bumIntra.gateway.config;

import java.util.List;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.config.headers")
public interface GatewayResponseHeaderConfig {

	@WithDefault("x-internal-, x-bumintra-, x-envoy-,x-forwarded-")
	List<String> responseStripPrefixes();

	@WithDefault("server, via, x-powered-by")
	List<String> responseStripHeaders();

	default List<String> stripPrefixesLower() {
		return responseStripPrefixes().stream()
				.filter(s -> s != null && !s.isBlank())
				.map(s -> s.trim().toLowerCase())
				.toList();
	}

	default List<String> stripHeadersLower() {
		return responseStripHeaders().stream()
				.filter(s -> s != null && !s.isBlank())
				.map(s -> s.trim().toLowerCase())
				.toList();
	}
}
