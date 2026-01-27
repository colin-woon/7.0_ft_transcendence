package org.bumIntra.gateway.config;

import java.time.Duration;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@StaticInitSafe
@ConfigMapping(prefix = "gateway.config.ratelimit")
public interface GatewayRateLimitConfig {

	@WithDefault("true")
	boolean enabled();

	// Token bucket capacity
	@WithDefault("60")
	long limit();

	// Bucket refill window
	@WithDefault("60s")
	Duration window();

	@WithDefault("ip-auth")
	String keyScheme();
}
