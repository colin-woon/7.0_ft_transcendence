package org.acme.api;

import java.net.URI;

import org.acme.dto.UserResponseDTO;
import org.acme.service.AuthService;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/public/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PublicAuthResource {

	@Inject
	AuthService authService;

	@Inject
	SecurityIdentity identity;

	/**
	 * OAuth login endpoint - called AFTER successful OAuth authentication
	 * Quarkus OIDC automatically redirects here once Google/42 confirms identity
	 * Creates session + access tokens, then redirects to login endpoint for cleanup
	 */
	@GET
	@Path("/login/{provider}")
	@Authenticated
	public Response login(
						@PathParam("provider") @DefaultValue("google") String provider,
						@QueryParam("isCookie") @DefaultValue("true") Boolean isCookie) throws java.net.URISyntaxException {
		UserResponseDTO userResponse = authService.createToken(identity);
		Response.ResponseBuilder responseBuilder = Response
			.seeOther(new URI("https://localhost/profile"))
			.entity(userResponse)
			.cookie(authService.createSessionCookie(identity))
			.cookie(authService.clearOIDCCookies());
		if (isCookie)
			responseBuilder.cookie(authService.createAccessTokenCookie(userResponse.accessToken));

		return responseBuilder.build();
	}

	/**
	 * OAuth callback endpoint - Handles OAuth provider redirect
	 * 
	 * OIDC automatically processes the code/state parameters.
	 * After code exchange and token validation, OIDC sets q_auth cookie.
	 * 
	 * With restore-path-after-redirect=true, Quarkus will redirect browser
	 * back to the original login path (/api/public/auth/login/{provider})
	 * which will now execute the login() method above.
	 * 
	 * This endpoint just receives the callback - OIDC handles everything.
	 */
	@GET
	@Path("/callback/{provider}")
	@PermitAll
	public Response handleCallback(@PathParam("provider") String provider) {
		// OIDC has already processed the callback and set cookies
		// Return OK - OIDC will handle the redirect back to login path
		return Response.ok("{\"status\": \"callback received\"}").build();
	}
}
