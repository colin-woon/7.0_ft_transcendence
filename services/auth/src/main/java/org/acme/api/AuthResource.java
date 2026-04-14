package org.acme.api;

import java.util.List;

import org.acme.dto.AdminUpdateDTO;
import org.acme.dto.IntraInfoDTO;
import org.acme.dto.PasswordChangeDTO;
import org.acme.dto.PasswordLoginDTO;
import org.acme.dto.PasswordRegisterDTO;
import org.acme.dto.SessionDTO;
import org.acme.dto.UserInfoDTO;
import org.acme.dto.UserResponseDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.dto.UserUpdateDTO;
import org.acme.model.User;
import org.acme.service.AdminService;
import org.acme.service.AuthService;
import org.acme.service.IntraService;
import org.acme.service.ProfileService;
import org.acme.service.UserService;
import org.eclipse.jdt.annotation.NonNull;
import org.eclipse.microprofile.jwt.JsonWebToken;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
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
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

	@Inject
	AdminService adminService;

	@Inject
	ProfileService profileService;

	@Inject
	IntraService intraService;

	@Inject
	UserService userService;

	@Inject
	SecurityIdentity identity;

	// =============================================================
	// AUTH RESOURCE ENDPOINTS
	// =============================================================
	// @GET
	// @Path("/login/{provider}")
	// @Authenticated
	// public Response login(
	// 					@PathParam("provider") @DefaultValue("google") String provider,
	// 					@QueryParam("isCookie") @DefaultValue("true") Boolean isCookie) throws java.net.URISyntaxException {
	// 	UserResponseDTO userResponse = authService.createToken(identity);
	// 	Response.ResponseBuilder responseBuilder = Response
	// 		.seeOther(new URI("https://localhost/profile"))
	// 		.entity(userResponse)
	// 		.cookie(authService.createSessionCookie(identity))
	// 		.cookie(authService.clearOIDCCookies());
	// 	if (isCookie)
	// 		responseBuilder.cookie(authService.createAccessTokenCookie(userResponse.accessToken));

	// 	return responseBuilder.build();
	// }

	// To refresh the user after access token expires
	@GET
	@Path("/refresh")
	@PermitAll
	public Response refresh(
						@CookieParam("sessionId") String sessionId,
						@QueryParam("isCookie") @DefaultValue("true") Boolean isCookie) {
		UserResponseDTO userResponse = authService.refreshToken(sessionId);
		Response.ResponseBuilder responseBuilder = Response
			.status(200)
			.entity(userResponse);
		if (isCookie)
			responseBuilder.cookie(authService.createAccessTokenCookie(userResponse.accessToken));

		return responseBuilder.build();
	}

	// To authenticate with email and password, not with OIDC
	@POST
	@Path("/password/login")
	@PermitAll
	public Response passwordLogin(
						@Valid PasswordLoginDTO loginDTO,
						@QueryParam("isCookie") @DefaultValue("true") Boolean isCookie) {
		User user = userService.authenticateWithPassword(loginDTO);
		UserResponseDTO userResponse = authService.createTokenForUser(user);

		Response.ResponseBuilder responseBuilder = Response.ok(userResponse)
			.cookie(authService.createSessionCookieForUser(user));
		if (isCookie)
			responseBuilder.cookie(authService.createAccessTokenCookie(userResponse.accessToken));

		return responseBuilder.build();
	}

	// To register with email and password, not with OIDC (account creation is kept separate)
	@POST
	@Path("/password/register")
	@PermitAll
	public Response passwordRegister(
							@Valid PasswordRegisterDTO registerDTO,
							@QueryParam("isCookie") @DefaultValue("true") Boolean isCookie) {
		User user = userService.registerWithPassword(registerDTO);
		UserResponseDTO userResponse = authService.createTokenForUser(user);

		Response.ResponseBuilder responseBuilder = Response.status(201)
			.entity(userResponse)
			.cookie(authService.createSessionCookieForUser(user));
		if (isCookie)
			responseBuilder.cookie(authService.createAccessTokenCookie(userResponse.accessToken));

		return responseBuilder.build();
	}

	// To Logout the user from the current session, or a specific session
	// If targetSessionId is provided, that session is deleted;
	// otherwise the current session (from cookie) is deleted.
	// The cookie is only cleared if the deleted session matches the cookie session.
	@POST
	@Path("/logout")
	@Authenticated
	public Response logout(
			@CookieParam("sessionId") String cookieSessionId,
			@QueryParam("sessionId") String targetSessionId) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();
		Long userId = Long.valueOf(jwt.getSubject());

		NewCookie clearCookie = authService.deleteSession(targetSessionId, cookieSessionId, userId);
		Response.ResponseBuilder response = Response.ok()
			.entity("{\"message\": \"Session logged out\"}");

		if (clearCookie != null)
			response.cookie(clearCookie);
		return response.build();
	}

	// To Logout the user from all sessions
	@POST
	@Path("/logout/all")
	@Authenticated
	public Response logoutAll() {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return Response.ok()
			.entity("{\"message\": \"All sessions logged out\"}")
			.cookie(authService.deleteAllSessions(Long.valueOf(jwt.getSubject())))
			.build();
	}

	// To list the active sessions of the user
	@GET
	@Path("/sessions")
	@Authenticated
	public List<@NonNull SessionDTO> listSessions(@CookieParam("sessionId") String cookieSessionId) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return authService.listSessions(Long.valueOf(jwt.getSubject()), cookieSessionId);
	}

	// To check the health of the service
	@GET
	@Path("/health")
	@PermitAll
	public Response healthCheck() {
		return Response.ok()
			.entity(authService.healthCheck())
			.build();
	}

	// =============================================================
	// PROFILE RESOURCE ENDPOINTS
	// =============================================================
	// To get the user info of the currently logged in user
	@GET
	@Path("/me")
	@Authenticated
	public UserInfoDTO getMyInfo() {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return profileService.getMyInfo(Long.valueOf(jwt.getSubject()));
	}

	// To update the current user info
	@PATCH
	@Path("/me")
	@Authenticated
	public UserInfoDTO updateMyInfo(@Valid UserUpdateDTO updateDTO) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return profileService.updateMyInfo(Long.valueOf(jwt.getSubject()), updateDTO);
	}

	// To update the current user password
	@POST
	@Path("/me/password")
	@Authenticated
	public UserInfoDTO updateMyPassword(@Valid PasswordChangeDTO changeDTO) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		User user = userService.updatePassword(Long.valueOf(jwt.getSubject()), changeDTO);
		IntraInfoDTO intraInfo = user.intra != null ? new IntraInfoDTO(user.intra) : null;
		return new UserInfoDTO(user, intraInfo);
	}

	// To delete the current logged in user
	@DELETE
	@Path("/delete")
	@Authenticated
	public Response deleteAccount() {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return Response.noContent()
			.cookie(profileService.deleteAccount(Long.valueOf(jwt.getSubject())))
			.build();
	}

	// To search for users by email or username
	// ADMIN users can search for all users,
	// while STUDENT users can only search for other STUDENT users
	@GET
	@Path("/users")
	@Authenticated
	public List<@NonNull UserSummaryDTO> searchUser(
			@QueryParam("q") @DefaultValue("") String query,
			@QueryParam("page") @DefaultValue("0") int page,
			@QueryParam("size") @DefaultValue("10") int size) {

		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return profileService.searchUser(query, page, size, jwt.getGroups());
	}

	// To lookup user by id, returning user info
	// ADMIN users can lookup all users,
	// while STUDENT users can only lookup other STUDENT users
	@GET
	@Path("/users/{id}")
	@Authenticated
	public UserInfoDTO lookUpUser(@PathParam("id") long id) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return profileService.getUserInfo(id, jwt.getGroups());
	}

	// =============================================================
	// INTRA RESOURCE ENDPOINTS
	// =============================================================
	@POST
	@Path("/reload")
	@Authenticated
	public Response reloadFrom42(@QueryParam("userId") String userId) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return Response.ok()
				.entity(intraService.reloadFrom42(userId, Long.valueOf(jwt.getSubject())))
				.build();
	}

	// =============================================================
	// ADMIN RESOURCE ENDPOINTS
	// =============================================================
	// To update any user info by id
	@PATCH
	@Path("/admin/users/{id}")
	@RolesAllowed("ADMIN")
	public UserInfoDTO adminUpdateUser(@PathParam("id") long id, @Valid AdminUpdateDTO updateDTO) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		return adminService.adminUpdateUser(id, Long.valueOf(jwt.getSubject()), updateDTO);
	}

	// To logout any user by id, from all sessions
	@POST
	@Path("/admin/users/{id}/logout")
	@RolesAllowed("ADMIN")
	public Response adminLogoutUser(@PathParam("id") long id) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		adminService.adminLogoutUser(id, Long.valueOf(jwt.getSubject()));
		return Response.ok()
			.entity("{\"message\": \"User logged out\"}")
			.build();
	}

	// To create a new user, user will not be linked to any provider(google/42)
	@POST
	@Path("/admin/users/create")
	@RolesAllowed("ADMIN")
	public Response adminCreateUser(@Valid UserInfoDTO userInfo) {
		return Response.status(201)
			.entity(adminService.adminCreateUser(userInfo))
			.build();
	}

	// To delete any user by id
	@DELETE
	@Path("/admin/users/{id}/delete")
	@RolesAllowed("ADMIN")
	public Response adminDeleteUser(@PathParam("id") long id) {
		JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();

		adminService.adminDeleteAccount(id, Long.valueOf(jwt.getSubject()));
		return Response.noContent().build();
 	}
}
