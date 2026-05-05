package org.bumIntra.gateway.obs.event;

import java.time.Instant;
import java.util.Optional;

public record GatewayWsThrottle(
        String sessionId,
        String clientIp,
        Optional<String> userId,
        WsThrottleType type,
        Instant at) {

    public enum WsThrottleType {
        CONN_IP, // Connection limit per IP
        CONN_USER, // Connection limit per User
        FRAME, // Frame rate limit
    }
}
