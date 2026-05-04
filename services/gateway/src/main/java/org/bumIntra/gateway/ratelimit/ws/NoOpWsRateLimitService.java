package org.bumIntra.gateway.ratelimit.ws;

import io.quarkus.arc.properties.UnlessBuildProperty;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
@UnlessBuildProperty(name = "gateway.config.ratelimit.enabled", stringValue = "true")
public class NoOpWsRateLimitService implements WsRateLimiter {

    @Override
    public io.smallrye.mutiny.Uni<Boolean> allowPreAuthConnection(String clientIp) {
        return Uni.createFrom().item(true);
    }

    @Override
    public io.smallrye.mutiny.Uni<Boolean> allowAuthenticatedConnection(String userId) {
        return Uni.createFrom().item(true);
    }

    @Override
    public io.smallrye.mutiny.Uni<Boolean> allowFrameTraffic(String userId) {
        return Uni.createFrom().item(true);
    }
}
