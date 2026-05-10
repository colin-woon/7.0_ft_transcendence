package org.acme.api;

import org.acme.dto.UserResponseDTO;
import org.acme.model.User;
import org.acme.service.AuthService;
import org.acme.service.UserService;
import org.jboss.logging.Logger;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/public/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PublicAuthResource {

	private static final Logger LOG = Logger.getLogger(PublicAuthResource.class);

	@Inject
	AuthService authService;

	@Inject
	UserService userService;

	@Inject
	SecurityIdentity identity;

	/**
	 * OAuth login endpoint - Starts the OIDC flow
	 * Quarkus OIDC redirects here after callback
	 * Creates user if not exists, syncs if does with populated identity
	 * Creates session + access tokens, then redirects to frontend profile page
	 */
	@GET
	@Path("/login/{provider}")
	@Authenticated
	public Response login(@PathParam("provider") @DefaultValue("google") String provider) {
		try {
			User user = userService.syncUser(identity, null);
			UserResponseDTO userResponse = authService.createToken(user);
			return Response.seeOther(authService.resolveRedirectUri("/profile"))
				.entity(userResponse)
				.cookie(authService.createSessionCookie(user))
				.cookie(authService.clearOIDCCookies())
				.cookie(authService.createAccessTokenCookie(userResponse.accessToken))
				.build();

		} catch (WebApplicationException e) {
			LOG.debug("Error during login", e);
			int status = e.getResponse() == null ? 500 : e.getResponse().getStatus();
			boolean shouldClearAuth = status == 401 || status == 403 || status == 404;
			Response.ResponseBuilder response = Response
				.seeOther(authService.resolveRedirectUri("/login", e.getMessage(), true))
				.cookie(authService.clearOIDCCookies());
			if (shouldClearAuth) {
				response.cookie(authService.clearAuthCookies());
			}
			return response.build();
		} catch (Exception e) {
			LOG.error("Unexpected error during login callback", e);
			return Response
				.seeOther(authService.resolveRedirectUri("/login", "auth_failed", true))
				.cookie(authService.clearOIDCCookies())
				.build();
		}
	}

	/**
	 * OAuth link endpoint - same OIDC flow as /login/{provider}, but links the provider
	 * identity to the currently logged-in user (identified by session cookie).
	 */
	@GET
	@Path("/link/{provider}")
	@Authenticated
	public Response link(@PathParam("provider") @DefaultValue("google") String provider,
						@CookieParam("sessionId") String sessionId) {
		try {
			User linkedUser = userService.syncUser(identity,
					authService.validateSessionUser(sessionId));
			UserResponseDTO userResponse = authService.createToken(linkedUser);
			return Response.seeOther(authService.resolveRedirectUri("/settings", "link_success", false))
				.entity(userResponse)
				.cookie(authService.clearOIDCCookies())
				.cookie(authService.createAccessTokenCookie(userResponse.accessToken))
				.build();

		} catch (WebApplicationException e) {
			LOG.debug("Error during linking", e);
			int status = e.getResponse() == null ? 500 : e.getResponse().getStatus();
			boolean invalidSession = status == 401 || status == 404;
			String redirect = invalidSession ? "/login" : "/settings";
			return Response
				.seeOther(authService.resolveRedirectUri(redirect, e.getMessage(), true))
				.cookie(authService.clearOIDCCookies())
				.build();
		} catch (Exception e) {
			LOG.error("Unexpected error during link callback", e);
			return Response
				.seeOther(authService.resolveRedirectUri("/settings", "link_failed", true))
				.cookie(authService.clearOIDCCookies())
				.build();
		}
	}
}
