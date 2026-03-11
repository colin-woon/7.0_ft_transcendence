package org.bumIntra.gateway.config;

import java.util.List;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithName;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.auth")
public interface GatewayAuthConfig {
	@WithName("required")
	boolean required();

	@WithName("public-paths")
	List<String> getPublicPaths();
}
