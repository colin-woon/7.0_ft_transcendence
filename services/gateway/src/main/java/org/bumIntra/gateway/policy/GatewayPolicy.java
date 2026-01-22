package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.security.GatewayRequestContext;

public interface GatewayPolicy {

	// Numbers are semantic, not magic:
	//
	// 0–99 → pre-auth policies
	//
	// 100–199 → auth-related
	//
	// 200+ → post-auth (rate limit, quotas, etc.)
	int order();

	void evaluate(GatewayRequestContext ctx);
}
