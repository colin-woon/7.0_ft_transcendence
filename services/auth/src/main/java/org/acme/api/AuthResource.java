package org.acme.api;

import org.acme.dto.*;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.stream.Collectors;
import org.acme.service.AuthService;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

	//for registration
    @POST
    @Path("/register")
    public Response register(@Valid UserCreateDTO userDTO) {
        return Response.status(201)
            .entity(authService.registerUser(userDTO))
            .build();
    }

	//for update info page
	@PATCH
	@Path("/update/{userid}")
	public UserResponseDTO updateUser(@PathParam("userid") long userid, @Valid UserUpdateDTO updateDTO) {
		return authService.updateUserInfo(userid, updateDTO);
	}

	//can choose to remove this later, currently for dev purpose
	@GET
    @Path("/users")
    public List<UserResponseDTO> getAllUsers() {
        return authService.getAllUsers();
	}

	// retrieve comprehensive single user info, prolly use in profile
	@GET
	@Path("/userinfo/{userid}")
	public UserResponseDTO getUserInfo(@PathParam("userid") long userid){
		return authService.getUserInfo(userid);
	}

	//retrieve list of user summaries (only name,id and profile pic), will use in dropdown menu 
	@GET
    @Path("/userssummary")
    public List<UserSummaryDTO> listUsersSummary() {
        return authService.getUsersSummary();
	}
}