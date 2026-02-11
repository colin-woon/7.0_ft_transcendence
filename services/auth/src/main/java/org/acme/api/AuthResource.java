package org.acme.api;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.UserCreateDTO;
import org.acme.dto.UserResponseDTO; 
import java.util.List;
import java.util.stream.Collectors;
import org.acme.service.AuthService;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/register")
    public Response register(@Valid UserCreateDTO userDTO) {
        return Response.status(201)
            .entity(authService.registerUser(userDTO))
            .build();
    }

	@GET
    @Path("/users")
    public List<UserResponseDTO> listUsers() {
        return authService.getAllUsers();
	}
}