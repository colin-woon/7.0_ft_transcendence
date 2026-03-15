package org.bumIntra.gateway.websocket;

import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.security.IdentityHeaders;
import org.eclipse.microprofile.jwt.JsonWebToken;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.websocket.Session;

@ApplicationScoped
@ActivateRequestContext
public class WsAuthHandler {

	@Inject
	SecurityIdentity si;

	@Inject
	GatewayAuthConfig gac;

	public boolean authenticate(Session session) {
		if (!gac.required()) {
			session.getUserProperties().put(IdentityHeaders.USER_ID, "42");
			session.getUserProperties().put(IdentityHeaders.USER_ROLES, "STUDENT");
			return true;
		}

		if (si.isAnonymous()) {
			return false;
		}

		if (si.getPrincipal() instanceof JsonWebToken) {
			JsonWebToken jwt = (JsonWebToken) si.getPrincipal();
			session.getUserProperties().put(IdentityHeaders.USER_ID, jwt.getSubject());
			session.getUserProperties().put(IdentityHeaders.USER_ROLES, jwt.getGroups());
			return true;
		}
		return false;
	}
}
