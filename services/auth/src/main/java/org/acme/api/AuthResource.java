package org.acme.api;

import java.util.List;

import org.acme.dto.UserInfoDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.dto.UserUpdateDTO;
import org.acme.service.AuthService;
import org.eclipse.jdt.annotation.NonNull;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

	@Inject
	SecurityIdentity identity;

	// To Login the user, giving an access and refresh token
	@GET
	@Path("/login/{provider}")
	@Authenticated
	public Response login(@PathParam("provider") String provider) {
		return Response.status(200)
			.entity(authService.createToken(identity))
			.cookie(authService.createSessionCookie(identity))
			.build();
		// String redirect = "/index.html#token=" + authService.createToken(identity).accessToken;
		// return Response
				// .seeOther(java.net.URI.create(redirect))
				// .cookie(authService.createSessionCookie(identity))
				// .build();
	}

	// To refresh the user after access token expires
	@POST
	@Path("/refresh")
	// @PermitAll
	public Response refresh(@CookieParam("sessionId") String sessionId) {
		return Response.status(200)
			.entity(authService.refreshToken(sessionId))
			.build();
	}

	// To Logout the user, invalidate the access and refresh token
	@POST
	@Path("/logout")
	@Authenticated
	// @RolesAllowed({"STUDENT", "ADMIN"})
	public Response logout(@CookieParam("sessionId") String sessionId) {
		return Response.ok()
			.entity("{\"message\": \"Logged out\"}")
			.cookie(authService.deleteSession(sessionId))
			.build();
	}

	@DELETE
	@Path("/delete")
	@Authenticated
	// @RolesAllowed({"STUDENT", "ADMIN"})
	public Response deleteAccount() {
		return Response.noContent()
			.cookie(authService.deleteAccount(identity))
			.build();
	}

	// To get the user info of the currently logged in user
	@GET
	@Path("/me")
	@Authenticated
	// @RolesAllowed({"STUDENT", "ADMIN"})
	public UserInfoDTO getMyInfo() {
		return authService.getMyInfo(identity);
	}

	// To update the current user info
	@PATCH
	@Path("/me")
	@Authenticated
	// @RolesAllowed({"STUDENT", "ADMIN"})
	public UserInfoDTO updateMyInfo(@Valid UserUpdateDTO updateDTO) {
		return authService.updateMyInfo(identity, updateDTO);
	}

	// To search for users by email or username, returning list of user summaries (id, name and profile pic)
	@GET
	@Path("/users")
	// @PermitAll
	public List<@NonNull UserSummaryDTO> searchUser(
			@QueryParam("q") @DefaultValue("") String query,
			@QueryParam("page") @DefaultValue("0") int page,
			@QueryParam("size") @DefaultValue("10") int size) {
		String safeQuery = (query == null) ? "" : query.trim();
		return authService.searchUser(safeQuery, page, size);
	}

	// To lookup user by id, returning user info
	@GET
	@Path("/users/{id}")
	// @PermitAll
	public UserInfoDTO lookUpUser(@PathParam("id") long id) {
		return authService.getUserInfo(id);
	}

	// @GET
	// @Path("/public-key")
	// public Response getPublicKey() {
		// return Response.ok()
			// .entity(authService.getPublicKey())
			// .build();
	// }

	// In the future, I will add some @RoleAllowed(ADMIN) only functions for testing purposes
}
