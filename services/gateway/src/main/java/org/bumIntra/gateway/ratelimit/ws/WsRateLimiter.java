package org.bumIntra.gateway.ratelimit.ws;

import io.smallrye.mutiny.Uni;

public interface WsRateLimiter {

	Uni<Boolean> allowAnonymousConnection(String clientIp);

	Uni<Boolean> allowUserConnection(String userId);

	Uni<Boolean> allowMessage(String userId);

}
