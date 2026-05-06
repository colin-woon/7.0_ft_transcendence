package org.acme.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.acme.dto.IntraDTO;
import org.acme.dto.IntraInfoDTO;
import org.acme.dto.SeedRecordDTO;
import org.acme.dto.UserInfoDTO;
import org.acme.model.Intra;
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

	/**
	 * Parses the 42 user info payload from OIDC into the raw Intra DTO.
	 */
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
		SeedRecordDTO.SeedIntraData compact = toSeedIntraData(dto);
		return syncIntraData(user, compact);
	}

	/**
	 * Persists compact intra data used by auth/profile flows.
	 */
	@Transactional
	public Intra syncIntraData(User user, SeedRecordDTO.SeedIntraData data) {
		Intra intra = intraRepository.findByUserId(user.id).orElse(new Intra());
		intra.user = user;

		intra.phone = data.phone;
		intra.location = data.location;
		intra.wallet = data.wallet;
		intra.correctionPoints = data.correctionPoints;
		intra.poolMonth = data.poolMonth;
		intra.poolYear = data.poolYear;
		intra.isStaff = data.isStaff;
		intra.isAlumni = data.isAlumni;
		intra.isActive = data.isActive;
		intra.originalImageUrl = data.imageUrl;

		intra.groupsCount = data.groupsCount;
		intra.partnershipsCount = data.partnershipsCount;
		intra.cursus = data.cursusUsers;
		intra.projects = data.projectsUsers;
		intra.achievements = data.achievements;
		intra.titlesUsers = data.titlesUsers;
		intra.languages = data.languagesUsers;
		intra.expertises = data.expertisesUsers;
		intra.campusUsers = data.campusUsers;

		intraRepository.persist(intra);
		return intra;
	}

	/**
	 * Converts the full 42 API payload into a compact seed/profile structure.
	 */
	public SeedRecordDTO.SeedIntraData toSeedIntraData(IntraDTO dto) {
		SeedRecordDTO.SeedIntraData data = new SeedRecordDTO.SeedIntraData();
		if (dto == null) {
			return data;
		}

		data.intraId = dto.id != null ? dto.id.toString() : null;
		data.phone = dto.phone;
		data.location = dto.location;
		data.wallet = dto.wallet;
		data.correctionPoints = dto.correctionPoints;
		data.poolMonth = dto.poolMonth;
		data.poolYear = dto.poolYear;
		data.isStaff = dto.isStaff;
		data.isAlumni = dto.isAlumni;
		data.isActive = dto.isActive;
		data.imageUrl = dto.image != null ? dto.image.link : null;

		data.groupsCount = dto.groups != null ? dto.groups.size() : 0;
		data.partnershipsCount = dto.partnerships != null ? dto.partnerships.size() : 0;

		data.cursusUsers = compactCursusUsers(dto.cursusUsers);
		data.projectsUsers = compactProjects(dto.projectsUsers);
		data.achievements = compactAchievements(dto.achievements);
		data.titlesUsers = compactTitlesUsers(dto.titlesUsers);
		data.languagesUsers = compactLanguagesUsers(dto.languagesUsers);
		data.expertisesUsers = compactExpertises(dto.expertisesUsers);
		data.campusUsers = compactCampusUsers(dto.campusUsers);

		return data;
	}

	/**
	 * Keeps only cursus fields used by profile summaries and charts.
	 */
	private List<Map<String, Object>> compactCursusUsers(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(c -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			putIfPresent(compact, "cursus_id", c.get("cursus_id"));
			putIfPresent(compact, "kind", c.get("kind"));
			putIfPresent(compact, "grade", c.get("grade"));
			putIfPresent(compact, "level", c.get("level"));
			putIfPresent(compact, "blackholed_at", c.get("blackholed_at"));
			compact.put("skills", compactSkills(asListOfMaps(c.get("skills"))));
			compact.put("cursus", compactNested(c.get("cursus"), List.of("id", "name", "slug")));
			return compact;
		}).collect(Collectors.toList());
	}

	/**
	 * Keeps only project progress fields used by profile summaries and recent project list.
	 */
	private List<Map<String, Object>> compactProjects(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(p -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			putIfPresent(compact, "status", p.get("status"));
			putIfPresent(compact, "validated", p.get("validated"));
			putIfPresent(compact, "final_mark", p.get("final_mark"));
			putIfPresent(compact, "updated_at", p.get("updated_at"));
			putIfPresent(compact, "marked_at", p.get("marked_at"));
			compact.put("project", compactNested(p.get("project"), List.of("id", "name")));
			return compact;
		}).collect(Collectors.toList());
	}

	/**
	 * Keeps achievement presentation fields used by the profile page.
	 */
	private List<Map<String, Object>> compactAchievements(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(a -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			putIfPresent(compact, "id", a.get("id"));
			putIfPresent(compact, "name", a.get("name"));
			putIfPresent(compact, "description", a.get("description"));

			Object tier = a.get("achievement_tier");
			if (tier == null && a.get("tier") != null) {
				tier = Map.of("name", a.get("tier"));
			}
			putIfPresent(compact, "achievement_tier", tier);
			return compact;
		}).collect(Collectors.toList());
	}

	private List<Map<String, Object>> compactTitlesUsers(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(t -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			compact.put("title", compactNested(t.get("title"), List.of("id", "name")));
			return compact;
		}).collect(Collectors.toList());
	}

	private List<Map<String, Object>> compactLanguagesUsers(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(l -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			compact.put("language", compactNested(l.get("language"), List.of("id", "name", "identifier")));
			return compact;
		}).collect(Collectors.toList());
	}

	private List<Map<String, Object>> compactExpertises(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(e -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			putIfPresent(compact, "id", e.get("id"));
			putIfPresent(compact, "level", e.get("level"));
			compact.put("expertise", compactNested(e.get("expertise"), List.of("id", "name")));
			return compact;
		}).collect(Collectors.toList());
	}

	private List<Map<String, Object>> compactCampusUsers(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(c -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			compact.put("campus", compactNested(c.get("campus"), List.of("id", "name")));
			return compact;
		}).collect(Collectors.toList());
	}

	private List<Map<String, Object>> compactSkills(List<Map<String, Object>> raw) {
		if (raw == null) return List.of();
		return raw.stream().map(s -> {
			Map<String, Object> compact = new java.util.LinkedHashMap<>();
			putIfPresent(compact, "id", s.get("id"));
			putIfPresent(compact, "name", s.get("name"));
			putIfPresent(compact, "level", s.get("level"));
			return compact;
		}).collect(Collectors.toList());
	}

	private Map<String, Object> compactNested(Object value, List<String> keys) {
		if (!(value instanceof Map<?, ?> mapValue)) {
			return Map.of();
		}
		Map<String, Object> compact = new java.util.LinkedHashMap<>();
		for (String key : keys) {
			Object picked = ((Map<?, ?>) mapValue).get(key);
			if (picked != null) {
				compact.put(key, picked);
			}
		}
		return compact;
	}

	private List<Map<String, Object>> asListOfMaps(Object value) {
		if (!(value instanceof List<?> listValue)) {
			return List.of();
		}
		return listValue.stream()
			.filter(Map.class::isInstance)
			.map(this::toStringObjectMap)
			.collect(Collectors.toList());
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> toStringObjectMap(Object entry) {
		return (Map<String, Object>) entry;
	}

	private void putIfPresent(Map<String, Object> target, String key, Object value) {
		if (value != null) {
			target.put(key, value);
		}
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
