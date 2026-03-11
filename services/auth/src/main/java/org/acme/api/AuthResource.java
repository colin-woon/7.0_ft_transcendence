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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
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

	@GET
	@Path("/headers")
	public Response getHeaders(@Context HttpHeaders headers) {
		System.out.println("Headers: " + headers.getRequestHeaders());
		return Response.ok()
				.entity(headers.getRequestHeaders())
				.build();
	}

	// To Login the user, giving an access and refresh token
	@GET
	@Path("/login/{provider}")
	@Authenticated
	public Response login(@PathParam("provider") String provider) {
		return Response.status(200)
				.entity(authService.createToken(identity))
				.cookie(authService.createSessionCookie(identity))
				.build();
	}

	// To refresh the user after access token expires
	@POST
	@Path("/refresh")
	public Response refresh(@CookieParam("sessionId") String sessionId) {
		return Response.status(200)
				.entity(authService.refreshToken(sessionId))
				.build();
	}

	// To Logout the user, invalidate the access and refresh token
	@POST
	@Path("/logout")
	@Authenticated
	public Response logout(@CookieParam("sessionId") String sessionId) {
		return Response.ok()
				.entity("{\"message\": \"Logged out\"}")
				.cookie(authService.deleteSession(sessionId))
				.build();
	}

	@DELETE
	@Path("/delete")
	@Authenticated
	public Response deleteAccount() {
		return Response.noContent()
				.cookie(authService.deleteAccount(identity))
				.build();
	}

	// To get the user info of the currently logged in user
	@GET
	@Path("/me")
	@Authenticated
	public UserInfoDTO getMyInfo() {
		return authService.getMyInfo(identity);
	}

	// To update the current user info
	@PATCH
	@Path("/me")
	@Authenticated
	public UserInfoDTO updateMyInfo(@Valid UserUpdateDTO updateDTO) {
		return authService.updateMyInfo(identity, updateDTO);
	}

	// To search for users by email or username, returning list of user summaries
	// (id, name and profile pic)
	@GET
	@Path("/users")
	public List<@NonNull UserSummaryDTO> searchUser(
			@QueryParam("q") @DefaultValue("") String query,
			@QueryParam("page") @DefaultValue("0") int page,
			@QueryParam("size") @DefaultValue("10") int size) {

		return authService.searchUser(query, page, size);
	}

	// To lookup user by id, returning user info
	@GET
	@Path("/users/{id}")
	public UserInfoDTO lookUpUser(@PathParam("id") long id) {
		return authService.getUserInfo(id);
	}
}
