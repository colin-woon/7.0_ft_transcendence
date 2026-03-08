package org.bumIntra.gateway.policy;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.ws.rs.container.ContainerRequestContext;

public interface GatewayPolicy {

	/**
	 * Gateway Policy Order Categorization
	 * -----------------------------------------------------------------------------
	 * Policies are executed linearly by the PolicyEngineFilter (Priority 960).
	 * * RANGE 0–99: PRE-AUTH (The "Static" Shield)
	 * - Focus: Infrastructure and Network safety.
	 * - Context: Identity is usually GUEST; JWT is not yet validated for business
	 * logic.
	 * - Examples: Global Maintenance Mode (10), IP Blacklisting (20), Geo-fencing
	 * (50).
	 *
	 * RANGE 100–199: AUTH-RELATED (The "Permission" Layer)
	 * - Focus: Mapping verified Identity (AuthLevel) to Request Path/Method.
	 * - Context: Relies on AuthLevel (GUEST, USER, ADMIN) set by ServiceAuthFilter.
	 * - Examples:
	 * - 100-120: Identity Gate (Reject GUEST on private paths).
	 * - 121-160: RBAC (Protecting /api/admin/** prefixes).
	 * - 161-199: Scope Validation (Read vs. Write permissions).
	 *
	 * RANGE 200+: POST-AUTH (The "Contextual" Layer)
	 * - Focus: Resource-level security and Request Enrichment.
	 * - Context: Request is verified; Identity is trusted. Safe to "Add" headers.
	 * - Examples:
	 * - 200-220: Identity Injection (Adding X-User-Id for downstream services).
	 * - 221-250: Resource Ownership (Checking if User A owns Resource B).
	 * - 251+: Business Quotas (Checking Redis/DB for rate limits or usage caps).
	 * -----------------------------------------------------------------------------
	 */
	int order();

	void evaluate(GatewayRequestContext ctx, ContainerRequestContext request);
}
