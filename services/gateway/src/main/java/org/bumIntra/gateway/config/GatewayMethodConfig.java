package org.bumIntra.gateway.config;

import java.util.Set;
import java.util.stream.Collectors;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.config.methods")
public interface GatewayMethodConfig {

	@WithDefault("GET, HEAD, POST, PUT, DELETE")
	Set<String> allowedMethods();

	default Set<String> allowedMethodsUpper() {
		return allowedMethods()
				.stream()
				.filter(s -> s != null && !s.isBlank())
				.map(s -> s.trim().toUpperCase())
				.collect(Collectors.toUnmodifiableSet());
	}
}
