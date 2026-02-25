package org.bumIntra.gateway.websocket;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.GatewayWsAuth;
import org.bumIntra.gateway.obs.GatewayWsClose;
import org.bumIntra.gateway.obs.GatewayWsOpen;
import org.bumIntra.gateway.obs.GatewayWsThrottle;
import org.bumIntra.gateway.websocket.ratelimit.WsRateLimitService;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.server.ServerEndpoint;
import jakarta.websocket.Session;

import org.bumIntra.gateway.websocket.AuthHandshakeConfig;
import jakarta.enterprise.context.control.ActivateRequestContext;

@ServerEndpoint(value = "/ws/chat", configurator = AuthHandshakeConfig.class)
@ApplicationScoped
public class ChatWebSocketEndPoint {

	// private static final Logger LOG =
	// Logger.getLogger(ChatWebSocketEndPoint.class);

	private static final String AUTHZ_STATE = "authState";
	private static final String USER_ID = "userId";
	private static final String LAST_THROTTLE_AT = "lastThrottleAt";
	private static final Duration THROTTLE_LOG_COOLDOWN = Duration.ofSeconds(2);

	@Inject
	AuthService authService;

	@Inject
	WsRateLimitService rls;

	@Inject
	GatewayObserverDispatcher obs;

	@OnOpen
	public void onOpen(Session session) {

		Instant authStart = Instant.now();

		String clientIp = (String) session.getUserProperties()
				.get(AuthHandshakeConfig.HP_CLIENT_IP);

		obs.onWsOpen(new GatewayWsOpen(
				session.getId(),
				clientIp,
				Instant.now()));

		session.getUserProperties().put(AUTHZ_STATE, "pending");

		if (clientIp == null || clientIp.isBlank() || "unknown".equals(clientIp)) {

			obs.onWsAuth(new GatewayWsAuth(
					session.getId(),
					clientIp,
					Optional.empty(),
					false,
					Optional.of("Cannot Determine Client IP"),
					Duration.between(authStart, Instant.now()),
					Instant.now()));

			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Cannot Determine Client IP");
			return;
		}

		// Connection-level rate limit (per IP)
		rls.allowConnection(clientIp).subscribe().with(allowed -> {

			if (!allowed) {

				obs.onWsThrottle(new GatewayWsThrottle(
						session.getId(),
						clientIp,
						Optional.empty(),
						GatewayWsThrottle.WsThrottleType.CONN_IP,
						clientIp,
						Instant.now()));

				terminate(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
						"Connection Rate Limit Exceeded");
				return;
			}

			String authz = (String) session.getUserProperties()
					.get(AuthHandshakeConfig.HP_AUTHZ);

			if (authz == null || authz.isBlank()) {

				obs.onWsAuth(new GatewayWsAuth(
						session.getId(),
						clientIp,
						Optional.empty(),
						false,
						Optional.of("Missing Authorization"),
						Duration.between(authStart, Instant.now()),
						Instant.now()));

				terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
						"Missing Authorization");
				return;
			}

			executeAuth(session, authz, authStart);

		}, e -> {

			obs.onWsThrottle(new GatewayWsThrottle(
					session.getId(),
					clientIp,
					Optional.empty(),
					GatewayWsThrottle.WsThrottleType.CONN_IP,
					clientIp,
					Instant.now()));

			terminate(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
					"Rate Limit Error");
		});
	}

	@OnMessage
	public void onMessage(String message, Session session) {

		String authState = (String) session.getUserProperties().get(AUTHZ_STATE);

		if (!"authenticated".equals(authState)) {

			obs.onWsAuth(new GatewayWsAuth(
					session.getId(),
					(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
					Optional.empty(),
					false,
					Optional.of("Not Authenticated"),
					Duration.ZERO,
					Instant.now()));

			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Not Authenticated");
			return;
		}

		String userId = (String) session.getUserProperties().get(USER_ID);

		if (userId == null) {

			obs.onWsAuth(new GatewayWsAuth(
					session.getId(),
					(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
					Optional.empty(),
					false,
					Optional.of("Invalid Session State"),
					Duration.ZERO,
					Instant.now()));

			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Invalid Session State");
			return;
		}

		rls.allowMessage(userId).subscribe().with(allowed -> {

			if (!allowed) {
				if (session.isOpen()) {
					session.getAsyncRemote().sendText(
							"{\"type\":\"throttled\",\"reason\":\"Message Rate Limit Exceeded\"}");

					Instant now = Instant.now();
					Instant last = (Instant) session.getUserProperties().get(LAST_THROTTLE_AT);
					if (last == null || Duration.between(last, now).compareTo(THROTTLE_LOG_COOLDOWN) >= 0) {
						session.getUserProperties().put(LAST_THROTTLE_AT, now);
						obs.onWsThrottle(new GatewayWsThrottle(
								session.getId(),
								(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
								Optional.of(userId),
								GatewayWsThrottle.WsThrottleType.MSG,
								userId,
								now));
					}
				}
				return;
			}

			if (session.isOpen()) {
				session.getAsyncRemote().sendText("Echo: " + message);
			}

		}, e -> {

			obs.onWsThrottle(new GatewayWsThrottle(
					session.getId(),
					(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
					Optional.of(userId),
					GatewayWsThrottle.WsThrottleType.MSG,
					userId,
					Instant.now()));

			if (session.isOpen()) {
				session.getAsyncRemote().sendText(
						"{\"type\":\"error\",\"reason\":\"Rate Limit Check Error\"}");
			}
		});
	}

	@OnClose
	public void onClose(Session session, CloseReason reason) {
		obs.onWsClose(new GatewayWsClose(
				session.getId(),
				Optional.ofNullable((String) session.getUserProperties().get(USER_ID)),
				reason.getCloseCode().getCode(),
				reason.getReasonPhrase(),
				Instant.now()));
	}

	@OnError
	public void onError(Session session, Throwable throwable) {
		obs.onWsError(session != null ? session.getId() : "unknown", throwable);
	}

	@ActivateRequestContext
	void executeAuth(Session session, String authorization, Instant authStart) {
		try {

			AuthResult authResult = authService.verify(authorization);

			if (authResult == null ||
					authResult.sub() == null ||
					authResult.sub().isBlank()) {

				session.getUserProperties().put(AUTHZ_STATE, "invalid");

				obs.onWsAuth(new GatewayWsAuth(
						session.getId(),
						(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
						Optional.empty(),
						false,
						Optional.of("Invalid Authorization"),
						Duration.between(authStart, Instant.now()),
						Instant.now()));
				terminate(session,
						CloseReason.CloseCodes.VIOLATED_POLICY,
						"Invalid Authorization");
				return;
			}

			String userId = authResult.sub();

			// Post-auth user-level connection gate
			rls.allowUserConnection(userId).subscribe().with(connAllowed -> {

				if (!connAllowed) {

					obs.onWsThrottle(new GatewayWsThrottle(
							session.getId(),
							(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
							Optional.of(userId),
							GatewayWsThrottle.WsThrottleType.CONN_USER,
							userId,
							Instant.now()));

					terminate(session,
							CloseReason.CloseCodes.TRY_AGAIN_LATER,
							"User Connection Rate Limit Exceeded");
					return;
				}

				session.getUserProperties().put(USER_ID, userId);
				session.getUserProperties().put("roles", authResult.roles());
				session.getUserProperties().put(AUTHZ_STATE, "authenticated");

				obs.onWsAuth(new GatewayWsAuth(
						session.getId(),
						(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
						Optional.of(userId),
						true,
						Optional.empty(), // TODO: put success reason if needed
						Duration.between(authStart, Instant.now()),
						Instant.now()));

				if (session.isOpen()) {
					session.getAsyncRemote().sendText(
							"{\"type\":\"authenticated\",\"userId\":\"" + userId + "\"}");
				}

			}, e -> {

				obs.onWsThrottle(new GatewayWsThrottle(
						session.getId(),
						(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
						Optional.of(userId),
						GatewayWsThrottle.WsThrottleType.CONN_USER,
						userId,
						Instant.now()));

				terminate(session,
						CloseReason.CloseCodes.UNEXPECTED_CONDITION,
						"Connection Rate Limit Error");
			});

		} catch (Exception e) {

			obs.onWsAuth(new GatewayWsAuth(
					session.getId(),
					(String) session.getUserProperties().get(AuthHandshakeConfig.HP_CLIENT_IP),
					Optional.empty(),
					false,
					Optional.of("Authentication Error"),
					Duration.between(authStart, Instant.now()),
					Instant.now()));

			terminate(session,
					CloseReason.CloseCodes.UNEXPECTED_CONDITION,
					"Authentication Error");
		}
	}

	private void terminate(Session session,
			CloseReason.CloseCodes code,
			String reason) {
		try {
			if (session != null && session.isOpen()) {
				session.close(new CloseReason(code, reason));
			}
			// obs.onWsClose(new GatewayWsClose(
			// session != null ? session.getId() : "unknown",
			// Optional.ofNullable(session != null ? (String)
			// session.getUserProperties().get(USER_ID) : null),
			// code.getCode(),
			// reason,
			// Instant.now()));
		} catch (Exception e) {
			obs.onWsError(session != null ? session.getId() : "unknown", e);
		}
	}
}
