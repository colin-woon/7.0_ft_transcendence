package org.acme.service;

import org.acme.dto.IntraDTO;
import org.acme.dto.IntraInfoDTO;
import org.acme.dto.UserInfoDTO;
import org.acme.model.Intra;
import org.acme.model.IntraImage;
import org.acme.model.User;
import org.acme.repository.IntraRepository;
import org.acme.repository.UserRepository;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class IntraService {
	private static final Logger LOG = Logger.getLogger(IntraService.class);

	@Inject
	IntraRepository intraRepository;

	@Inject
	IntraClientService intraClientService;

	@Inject
	ObjectMapper objectMapper;

	@Inject
	UserRepository userRepository;

	@Inject
	AvatarStorageService avatarStorageService;

	public IntraDTO parseUserInfo(UserInfo userinfo) {
		try {
			JsonObject jsonObject = userinfo.getJsonObject();
			return objectMapper.readValue(jsonObject.toString(), IntraDTO.class);
		} catch (JsonProcessingException e) {
			LOG.error("Failed to parse userinfo JSON", e);
			throw new WebApplicationException("Failed to process authentication payload", 500);
		}
	}

	@Transactional
	public Intra syncIntraData(User user, IntraDTO dto) {
		Intra intra = intraRepository.findByUserId(user.id).orElse(new Intra());
		intra.user = user;

		intra.kind = dto.kind;
		intra.url = dto.url;
		intra.phone = dto.phone;
		intra.location = dto.location;
		intra.wallet = dto.wallet;
		intra.correctionPoints = dto.correctionPoints;
		intra.poolMonth = dto.poolMonth;
		intra.poolYear = dto.poolYear;
		intra.isStaff = dto.isStaff;
		intra.isAlumni = dto.isAlumni;
		intra.isActive = dto.isActive;

		// JSONB fields
		if (dto.image != null) {
			IntraImage img = new IntraImage();
			img.link = dto.image.link;
			img.versions = dto.image.versions;
			intra.image = img;
		} else {
			intra.image = null;
		}
		intra.groups = dto.groups;
		intra.cursus = dto.cursusUsers;
		intra.projects = dto.projectsUsers;
		intra.achievements = dto.achievements;
		intra.titles = dto.titles;
		intra.titlesUsers = dto.titlesUsers;
		intra.partnerships = dto.partnerships;
		intra.patroned = dto.patroned;
		intra.patroning = dto.patroning;
		intra.languages = dto.languagesUsers;
		intra.expertises = dto.expertisesUsers;
		intra.roles = dto.roles;
		intra.campus = dto.campus;
		intra.campusUsers = dto.campusUsers;

		intraRepository.persist(intra);
		return intra;
	}

	@Transactional
	public void syncUserData(User user, IntraDTO dto) {
		user.fullName = dto.usualFullName != null ? dto.usualFullName : dto.displayName;
		if (dto.image != null && dto.image.link != null && !dto.image.link.isBlank()) {
			user.avatarUrl = avatarStorageService.mirrorRemoteAvatar(dto.image.link, user.avatarUrl);
		}
		userRepository.persist(user);
	}

	@Transactional
	public UserInfoDTO reloadFrom42(String userId, Long userIdFromToken) {
		String targetUserId = userId != null ? userId : String.valueOf(userIdFromToken);
		Long parsedTargetUserId;
		try {
			parsedTargetUserId = Long.valueOf(targetUserId);
		} catch (NumberFormatException e) {
			throw new WebApplicationException("Invalid user id", 400);
		}

		User user = userRepository.findById(parsedTargetUserId);
		if (user == null) {
			LOG.error("User Not Found to Reload" + targetUserId);
			throw new WebApplicationException("User not found", 404);
		}

		if (user.intraId == null || user.intraId.isBlank()) {
			LOG.error("User " + user.id + " is not linked to a 42 account, cannot reload");
			throw new WebApplicationException("User is not linked to a 42 account", 409);
		}

		String token = intraClientService.fetchClientToken();
		if (token == null) {
			LOG.error("Unable To access 42 token");
			throw new WebApplicationException("External identity provider unavailable", 503);
		}

		IntraDTO dto = intraClientService.fetchUser(token, user.intraId);
		if (dto == null) {
			LOG.error("Failed to fetch 42 profile for user: " + user.id + " (intraId=" + user.intraId + ")");
			throw new WebApplicationException("Failed to fetch user from 42 API", 502);
		}
		syncUserData(user, dto);
		Intra intra = syncIntraData(user, dto);

		return avatarStorageService.toUserInfoDTO(user, new IntraInfoDTO(intra));
	}
}
