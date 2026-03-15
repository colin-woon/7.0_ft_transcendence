package org.bumIntra.gateway.websocket;

import org.bumIntra.gateway.obs.event.GatewayWsThrottle;
import org.bumIntra.gateway.ratelimit.ws.WsRateLimiter;
import org.bumIntra.gateway.security.IdentityHeaders;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

@ServerEndpoint(value = "/ws/chat", configurator = WsHandshakeConfig.class)
@ApplicationScoped
public class WsChatServer {

	@Inject
	WsSessionStateHandler stateHandler;

	@Inject
	WsAuthHandler authHandler;

	@Inject
	WsObserverHandler obsHandler;

	@Inject
	WsRateLimiter rl;

	@OnOpen
	public void onOpen(Session session) {

		stateHandler.markPending(session);
		stateHandler.updateAuthStartAt(session);

		obsHandler.onOpen(session);

		if (!isValidSession(session)) {
			return;
		}

		execAuthFlow(session);
	}

	@OnClose
	public void onClose(Session session, CloseReason reason) {
		obsHandler.onClose(session, reason);
	}

	@OnMessage
	public void onMessage(Session session, String message) {

		if (!stateHandler.isAuthenticated(session)) {
			obsHandler.onAuthFailure(session, "Unauthorized message attempt");
			terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Unauthorized");
			return;
		}

		rl.allowMessage(stateHandler.getUserId(session))
				.subscribe().with(allowed -> {
					if (!allowed) {
						obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.MSG);
						terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER, "MSG Rate limit exceeded");
						return;
					}

					// Handle the message (for demo, we just echo it back)
					if (session.isOpen()) {
						session.getAsyncRemote().sendText("Echo: " + message);
					}
				}, e -> {
					obsHandler.onError(session, e);
					terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Internal error");
					return;
				});

	}

	@OnError
	public void onError(Session session, Throwable e) {
		obsHandler.onError(session, e);
	}

	private void terminateSession(Session session, CloseReason.CloseCodes code, String reason) {
		try {
			if (session != null && session.isOpen()) {
				session.close(new CloseReason(code, reason));
			}
		} catch (Exception e) {
			obsHandler.onError(session, e);
		}
	}

	private boolean isValidSession(Session session) {
		String clientIp = stateHandler.getClientIp(session);

		if (clientIp == null || clientIp.isEmpty() || clientIp.equalsIgnoreCase("unknown")) {
			obsHandler.onAuthFailure(session, "Invalid Client IP");
			terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Invalid Client IP");
			return false;
		}
		return true;
	}

	private void execAuthFlow(Session session) {
		rl.allowAnonymousConnection(stateHandler.getClientIp(session))
				.subscribe().with(allowed -> {
					if (!allowed) {
						obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.CONN_IP);
						terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER, "Rate limit exceeded");
						return;
					}

					if (!authHandler.authenticate(session)) {
						stateHandler.markUnauthorized(session);
						terminateSession(session, CloseReason.CloseCodes.VIOLATED_POLICY, "Unauthorized");
						return;
					}

					rl.allowUserConnection(stateHandler.getUserId(session))
							.subscribe().with(userAllowed -> {
								if (!userAllowed) {
									obsHandler.onThrottle(session, GatewayWsThrottle.WsThrottleType.CONN_USER);
									terminateSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
											"User rate limit exceeded");
									return;
								}

								stateHandler.markAuthenticated(session);
								obsHandler.onAuthSuccess(session);
							}, e -> {
								obsHandler.onError(session, e);
								terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION,
										"Internal error");
							});

				}, e -> {
					obsHandler.onError(session, e);
					terminateSession(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Internal error");
				});
	}

}
