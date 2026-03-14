package org.bumIntra.gateway.ratelimit.ws;

import org.bumIntra.gateway.ratelimit.RateLimitProfile;
import org.bumIntra.gateway.ratelimit.RateLimiter;

import io.quarkus.arc.properties.IfBuildProperty;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@IfBuildProperty(name = "gateway.config.ratelimit.enabled", stringValue = "true")
public class WsRateLimitService {

	@Inject
	RateLimiter rateLimiter;

	/**
	 * Connection-level limiter (pre-auth).
	 * Key format: ws:conn:{remoteIp}
	 */
	public Uni<Boolean> allowConnection(String remoteIp) {
		String key = "ws:conn:" + remoteIp;
		return allow(key, WsRateLimitProfiles.WS_CONN);
	}

	/**
	 * Post-auth per-user connection gate.
	 * Key format: ws:conn:user:{userId}
	 */
	public Uni<Boolean> allowUserConnection(String userId) {
		String key = "ws:conn:user:" + userId;
		return allow(key, WsRateLimitProfiles.WS_CONN_USER);
	}

	/**
	 * Key format: ws:msg:{userId}
	 */
	public Uni<Boolean> allowMessage(String userId) {
		String key = "ws:msg:" + userId;
		return allow(key, WsRateLimitProfiles.WS_MSG);
	}

	/**
	 * Wraps blocking Redis call and offloads it
	 * to worker pool to avoid event-loop starvation.
	 */
	private Uni<Boolean> allow(String key, RateLimitProfile profile) {
		return Uni.createFrom()
				.item(() -> rateLimiter.tryConsume(key, profile)) // blocking call
				.runSubscriptionOn(Infrastructure.getDefaultWorkerPool())
				.onFailure().recoverWithItem(false); // fail-closed
	}
}
