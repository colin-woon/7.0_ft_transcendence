package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import java.util.List;
import java.util.stream.Collectors;
import org.acme.dto.UserCreateDTO;
import org.acme.dto.UserResponseDTO;
import org.acme.dto.UserSummaryDTO;
import org.acme.dto.UserUpdateDTO;
import org.acme.model.User;
import org.acme.repository.UserRepository;

@ApplicationScoped
public class AuthService {

    @Inject
    UserRepository userRepository;

    @Transactional
    public UserResponseDTO registerUser(UserCreateDTO request) {
        // validation by checking if email/user exists or not
        if (userRepository.findByEmail(request.email).isPresent()) {
            throw new WebApplicationException("Email already taken", 409);
        }
        if (userRepository.findByUsername(request.username).isPresent()) {
            throw new WebApplicationException("Username already taken", 409);
        }

        // mapping user dto to entity
        User newUser = new User();
        newUser.email = request.email;
        newUser.username = request.username;
        newUser.fullName = request.fullName;
        newUser.intraId = request.intraId;
        newUser.googleId = request.googleId;
        newUser.avatarUrl = request.avatarUrl;
		// newUser.role = request.role; not needed, default to student

        // make persist
        userRepository.persist(newUser);

        // return dto response
        return new UserResponseDTO(
            newUser.id,
            newUser.email,
            newUser.username,
            newUser.fullName,
            newUser.avatarUrl,
			newUser.bio,
            newUser.role,
            newUser.createdAt
        );
	}

	@Transactional
	public UserResponseDTO updateUserInfo(long userId, UserUpdateDTO request){
		User user = userRepository.findById(userId);
        if (user == null) {
            throw new WebApplicationException("User not found", 404);
        }

		if (request.fullName != null) {
            user.fullName = request.fullName;
        }
        
        if (request.avatarUrl != null) {
            user.avatarUrl = request.avatarUrl;
        }
        
        if (request.bio != null) {
            user.bio = request.bio;
        }

		return new UserResponseDTO(
			user.id,
			user.email,
			user.username,
			user.fullName,
			user.avatarUrl,
			user.bio,
			user.role,
			user.createdAt
		);
	}

	public List<UserResponseDTO> getAllUsers() {
        return userRepository.listAll().stream()
            .map(user -> new UserResponseDTO(
                user.id,
                user.email,
                user.username,
                user.fullName,
                user.avatarUrl,
				user.bio,
                user.role,
                user.createdAt
            ))
            .collect(Collectors.toList());
    }

	public UserResponseDTO getUserInfo(Long userId) {
		User user = userRepository.findById(userId);

		if (user == null) {
        	throw new WebApplicationException("User not found", 404);
   		}

		return new UserResponseDTO(
			user.id,
			user.email,
			user.username,
			user.fullName,
			user.avatarUrl,
			user.bio,
			user.role,
			user.createdAt
		);
}

	public List<UserSummaryDTO> getUsersSummary() {
        return userRepository.listAll().stream()
            .map(user -> new UserSummaryDTO(
                user.id,
                user.username,
                user.fullName,
                user.avatarUrl
            ))
            .collect(Collectors.toList());
    }
}