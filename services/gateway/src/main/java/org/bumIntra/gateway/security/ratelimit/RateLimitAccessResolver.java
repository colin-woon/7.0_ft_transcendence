package org.bumIntra.gateway.security.ratelimit;

import org.bumIntra.gateway.security.GatewayRequestContext;

public interface RateLimitAccessResolver {

	RateLimitAccess resolve(GatewayRequestContext grc);
}
