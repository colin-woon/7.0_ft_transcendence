package org.bumIntra.gateway.ratelimit;

import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DefaultRateLimitResolver implements RateLimitAccessResolver {

	@Override
	public RateLimitAccess resolve(GatewayRequestContext grc) {

		return switch (grc.getAuthLevel()) {
			case SERVICE -> RateLimitAccess.SERVICE;
			case ADMIN -> RateLimitAccess.ADMIN;
			case USER -> RateLimitAccess.USER;
			default -> RateLimitAccess.GUEST;
		};
		// if (grc.isInternal()) {
		// return RateLimitAccess.SERVICE; // TODO: allowed internal after mTLS
		// validation
		// } else if (grc.isAuth()) {
		// return RateLimitAccess.USER;
		// }
		// return RateLimitAccess.GUEST;
	}
}
