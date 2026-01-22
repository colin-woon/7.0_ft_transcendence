package org.bumIntra.gateway.policy;

import java.util.Comparator;
import java.util.List;

import org.bumIntra.gateway.security.GatewayRequestContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

@ApplicationScoped
public class GatewayPolicyEngine {

	private final List<GatewayPolicy> _policies;

	@Inject
	public GatewayPolicyEngine(Instance<GatewayPolicy> policies) {
		// Sort policies by order
		_policies = policies.stream().sorted(Comparator.comparingInt(GatewayPolicy::order)).toList();

		if (_policies.isEmpty()) {
			throw new IllegalStateException("No GatewayPolicy implementations found");
		}
	}

	public void enforce(GatewayRequestContext ctx) {
		for (var policy : _policies) {
			policy.evaluate(ctx);
		}
	}
}
