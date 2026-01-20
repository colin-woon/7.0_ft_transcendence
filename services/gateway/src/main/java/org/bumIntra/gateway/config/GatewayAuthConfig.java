package org.bumIntra.gateway.config;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.auth")
public interface GatewayAuthConfig {
	boolean required();
}
