package org.bumIntra.gateway.ratelimit.ws;

import io.smallrye.mutiny.Uni;

public interface WsRateLimiter {

    Uni<Boolean> allowPreAuthConnection(String clientIp);

    Uni<Boolean> allowAuthenticatedConnection(String userId);

    Uni<Boolean> allowFrameTraffic(String userId);

}
