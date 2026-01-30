package org.bumIntra.gateway.security.ratelimit;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DefaultRateLimitResolver implements RateLimitAccessResolver {

	@Override
	public RateLimitAccess resolve(GatewayRequestContext grc) {

		if (grc.isInternal()) {
			return RateLimitAccess.SERVICE; // TODO: allowed internal after mTLS validation
		} else if (grc.isAuth()) {
			return RateLimitAccess.USER;
		}
		return RateLimitAccess.GUEST;
	}
}
