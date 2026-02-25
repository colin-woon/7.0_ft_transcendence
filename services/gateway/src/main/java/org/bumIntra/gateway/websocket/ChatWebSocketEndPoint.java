package org.bumIntra.gateway.websocket;

import java.util.Objects;

import org.bumIntra.gateway.client.AuthService;
import org.bumIntra.gateway.client.dto.AuthResult;
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

	private static final Logger LOG = Logger.getLogger(ChatWebSocketEndPoint.class);

	private static final String AUTHZ_STATE = "authState";
	private static final String USER_ID = "userId";

	@Inject
	AuthService authService;

	@Inject
	WsRateLimitService rls;

	@OnOpen
	public void onOpen(Session session) {

		LOG.info("WebSocket opened: " + session.getId());

		session.getUserProperties().put(AUTHZ_STATE, "pending");

		String clientIp = (String) session.getUserProperties()
				.get(AuthHandshakeConfig.HP_CLIENT_IP);

		if (clientIp == null || clientIp.isBlank() || "unknown".equals(clientIp)) {
			LOG.warn("Could not determine client IP | session " + session.getId());
			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Cannot Determine Client IP");
			return;
		}

		// Connection-level rate limit (per IP)
		rls.allowConnection(clientIp).subscribe().with(allowed -> {

			if (!allowed) {
				LOG.warn("WS_CONN limit exceeded for IP " + clientIp +
						" | session " + session.getId());
				terminate(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
						"Connection Rate Limit Exceeded");
				return;
			}

			String authz = (String) session.getUserProperties()
					.get(AuthHandshakeConfig.HP_AUTHZ);

			if (authz == null || authz.isBlank()) {
				LOG.warn("Missing Authorization header | session " + session.getId());
				terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
						"Missing Authorization");
				return;
			}

			executeAuth(session, authz);

		}, e -> {
			LOG.error("WS_CONN rate limit error | session " + session.getId(), e);
			terminate(session, CloseReason.CloseCodes.TRY_AGAIN_LATER,
					"Rate Limit Error");
		});
	}

	@OnMessage
	public void onMessage(String message, Session session) {

		String authState = (String) session.getUserProperties().get(AUTHZ_STATE);

		if (!"authenticated".equals(authState)) {
			LOG.warn("Message from unauthenticated session " + session.getId());
			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Not Authenticated");
			return;
		}

		String userId = (String) session.getUserProperties().get(USER_ID);

		if (userId == null) {
			terminate(session, CloseReason.CloseCodes.VIOLATED_POLICY,
					"Invalid Session State");
			return;
		}

		rls.allowMessage(userId).subscribe().with(allowed -> {

			if (!allowed) {
				if (session.isOpen()) {
					session.getAsyncRemote().sendText(
							"{\"type\":\"throttled\",\"reason\":\"Message Rate Limit Exceeded\"}");
				}
				return;
			}

			LOG.info("WS message | user " + userId +
					" | session " + session.getId() +
					" | payload: " + message);

			if (session.isOpen()) {
				session.getAsyncRemote().sendText("Echo: " + message);
			}

		}, e -> {
			LOG.error("WS_MSG rate limit error | session " + session.getId(), e);

			if (session.isOpen()) {
				session.getAsyncRemote().sendText(
						"{\"type\":\"error\",\"reason\":\"Rate Limit Check Error\"}");
			}
		});
	}

	@ActivateRequestContext
	void executeAuth(Session session, String authorization) {
		try {

			AuthResult authResult = authService.verify(authorization);

			if (authResult == null ||
					authResult.sub() == null ||
					authResult.sub().isBlank()) {

				LOG.warn("WS Invalid Auth | session " + session.getId());
				session.getUserProperties().put(AUTHZ_STATE, "invalid");
				terminate(session,
						CloseReason.CloseCodes.VIOLATED_POLICY,
						"Invalid Authorization");
				return;
			}

			String userId = authResult.sub();

			// Post-auth user-level connection gate
			rls.allowUserConnection(userId).subscribe().with(connAllowed -> {

				if (!connAllowed) {
					LOG.warn("WS_CONN_USER limit exceeded | userId " + userId +
							" | session " + session.getId());
					terminate(session,
							CloseReason.CloseCodes.TRY_AGAIN_LATER,
							"User Connection Rate Limit Exceeded");
					return;
				}

				session.getUserProperties().put(USER_ID, userId);
				session.getUserProperties().put("roles", authResult.roles());
				session.getUserProperties().put(AUTHZ_STATE, "authenticated");

				LOG.info("WS Auth Success | session " + session.getId() +
						" | userId: " + userId);

				if (session.isOpen()) {
					session.getAsyncRemote().sendText(
							"{\"type\":\"authenticated\",\"userId\":\"" + userId + "\"}");
				}

			}, e -> {
				LOG.error("WS_CONN_USER rate limit error | session " + session.getId(), e);
				terminate(session,
						CloseReason.CloseCodes.UNEXPECTED_CONDITION,
						"Connection Rate Limit Error");
			});

		} catch (Exception e) {

			LOG.error("WS Auth Error | session " + session.getId(), e);

			terminate(session,
					CloseReason.CloseCodes.UNEXPECTED_CONDITION,
					"Authentication Error");
		}
	}

	@OnClose
	public void onClose(Session session, CloseReason reason) {
		LOG.info("WebSocket closed | session " + session.getId() +
				" | code: " + reason.getCloseCode().getCode() +
				" | reason: " + reason.getReasonPhrase());
	}

	@OnError
	public void onError(Session session, Throwable throwable) {
		LOG.error("WebSocket error | session " + session.getId(), throwable);
	}

	private void terminate(Session session,
			CloseReason.CloseCodes code,
			String reason) {
		try {
			if (session != null && session.isOpen()) {
				session.close(new CloseReason(code, reason));
			}
			LOG.info("Session " + session.getId() +
					" terminated | code: " + code +
					" | reason: " + reason);
		} catch (Exception e) {
			LOG.error("Error terminating session " + session.getId(), e);
		}
	}
}
