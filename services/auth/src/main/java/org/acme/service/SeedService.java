package org.acme.service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.acme.dto.IntraDTO;
import org.acme.model.SeedMode;
import org.acme.model.User;
import org.acme.repository.UserRepository;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SeedService {
	private static final Logger LOG = Logger.getLogger(SeedService.class);

	@Inject
	UserRepository userRepository;

	@Inject
	UserService userService;

	@Inject
	IntraService intraService;

	@Inject
	ObjectMapper objectMapper;

	@Inject
	IntraClientService intraClientService;

	@ConfigProperty(name = "seed.mode", defaultValue = "off")
	SeedMode seedMode;

	@ConfigProperty(name = "seed.file", defaultValue = "src/main/resources/seed_data.json")
	String seedFilePath;

	@ConfigProperty(name = "seed.logins")
	String seedLoginsRaw;

	@ConfigProperty(name = "seed.campus")
	String seedCampus;

	@Transactional
	public void onStart(@Observes StartupEvent ev) {
		LOG.info("Seed mode: " + seedMode);
		switch (seedMode) {
			case OFF -> {}
			case FILE -> seedFromFile();
			default -> seedFromApi(seedMode);
		}
	}

	public boolean seedFromFile() {
		File file = new File(seedFilePath);
		if (!file.exists()) {
			LOG.info("No seed file found at: " + seedFilePath);
			return false;
		}
		try {
			IntraDTO[] data = objectMapper.readValue(file, IntraDTO[].class);
			for (IntraDTO dto : data) {
				User user = userService.createNewUser(dto);
				intraService.syncIntraData(user, dto);
			}
			LOG.info("Seeded " + data.length + " users from file");
			return true;
		} catch (IOException e) {
			LOG.error("Failed to read/parse seed file", e);
			return false;
		}
	}

	public void seedFromApi(SeedMode mode) {
		String token = intraClientService.fetchClientToken();
		if (token == null) {
			LOG.error("Cannot seed from API without access token");
			return ;
		}

		List<IntraDTO> fetched = new ArrayList<>();
		if (mode == SeedMode.LOGINS) {
			List<String> logins = Arrays.stream(seedLoginsRaw.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.toList();

			if (logins.isEmpty()) {
				LOG.warn("Seed mode API but no seed.logins configured");
				return;
			}
			
			for (String login : logins) {
				IntraDTO dto = intraClientService.fetchUser(token, login);
				if (dto != null) fetched.add(dto);
			}
		}
		else {
			List<String> campuses = Arrays.stream(seedCampus.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.toList();
			if (campuses.isEmpty()) {
				LOG.warn("Seed mode API but no seed.campus configured");
				return;
			}
			List<String> campusIds = intraClientService.fetchCampusIds(token, campuses);
			if (campusIds.isEmpty()) {
				LOG.warn("No valid campus IDs found for configured campuses: " + seedCampus);
				return;
			}
			for (String campusId : campusIds) {
				List<IntraDTO> users = intraClientService.fetchUsersByCampus(token, campusId);
				if (!users.isEmpty()) {
					fetched.addAll(users);
				}
			}
		}

		if (fetched.isEmpty()) {
			LOG.warn("No users fetched from 42 API");
			return;
		}

		Map<String, IntraDTO> deduplicated = deduplicateUsers(fetched);
		if (deduplicated.size() != fetched.size()) {
			LOG.info("Deduplicated seeded users from " + fetched.size() + " to " + deduplicated.size());
		}

		for (IntraDTO dto : deduplicated.values()) {
			upsertSeedUser(dto);
		}
		saveSeedFile(new ArrayList<>(deduplicated.values()));
		LOG.info("Seeded " + deduplicated.size() + " users from 42 API");
	}

	public void saveSeedFile(List<IntraDTO> data) {
		try {
			File file = new File(seedFilePath);
			file.getParentFile().mkdirs();
			objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, data);
			LOG.info("Saved seed data to: " + seedFilePath);
		} catch (IOException e) {
			LOG.error("Failed to save seed file", e);
		}
	}

	private Map<String, IntraDTO> deduplicateUsers(List<IntraDTO> users) {
		Map<String, IntraDTO> deduplicated = new LinkedHashMap<>();
		for (IntraDTO dto : users) {
			if (dto == null) {
				continue;
			}
			String key = dto.id != null
				? "id:" + dto.id
				: (dto.login != null && !dto.login.isBlank())
					? "login:" + dto.login.toLowerCase()
					: (dto.email != null && !dto.email.isBlank())
						? "email:" + dto.email.toLowerCase()
						: null;

			if (key != null) {
				deduplicated.put(key, dto);
			}
		}
		return deduplicated;
	}

	private void upsertSeedUser(IntraDTO dto) {
		if (dto == null || dto.id == null || dto.email == null || dto.email.isBlank()) {
			LOG.warn("Skipping invalid seed entry (missing id/email)");
			return;
		}

		User user = userRepository.findByIntraId(dto.id.toString()).orElse(null);
		if (user == null) {
			user = userRepository.findByEmail(dto.email).orElse(null);
		}

		if (user == null) {
			user = userService.createNewUser(dto);
		} else {
			if (user.intraId == null || user.intraId.isBlank()) {
				user.intraId = dto.id.toString();
			}
			user.fullName = dto.usualFullName != null ? dto.usualFullName : dto.displayName;
			user.avatarUrl = dto.image != null ? dto.image.link : null;
			userRepository.persist(user);
		}

		intraService.syncIntraData(user, dto);
	}
}
