package org.acme.service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.acme.dto.IntraDTO;
import org.acme.model.SeedMode;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.acme.repository.UserRepository;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

@ApplicationScoped
public class SeedService {
	private static final Logger LOG = Logger.getLogger(SeedService.class);
	private static final Pattern STRONG_PASSWORD_PATTERN = Pattern.compile(
		"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$");

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

	@Inject
	PasswordService passwordService;

	@ConfigProperty(name = "seed.mode", defaultValue = "off")
	SeedMode seedMode;

	@ConfigProperty(name = "seed.file", defaultValue = "src/main/resources/seed_data.json")
	String seedFilePath;

	@ConfigProperty(name = "seed.logins")
	String seedLoginsRaw;

	@ConfigProperty(name = "seed.campus")
	String seedCampus;

	@ConfigProperty(name = "seed.admin.enabled", defaultValue = "false")
	boolean seedAdminEnabled;

	@ConfigProperty(name = "seed.admin.email", defaultValue = "")
	String seedAdminEmail;

	@ConfigProperty(name = "seed.admin.login", defaultValue = "")
	String seedAdminLogin;

	@ConfigProperty(name = "seed.admin.password", defaultValue = "")
	String seedAdminPassword;

	public void onStart(@Observes StartupEvent ev) {
		ensureSeedAdminUser();
		LOG.info("Seed mode: " + seedMode);
		switch (seedMode) {
			case OFF -> {}
			case FILE -> loadSeedFile();
			default -> seedFromApi(seedMode);
		}
	}

	private void ensureSeedAdminUser() {
		if (!seedAdminEnabled) {
			return;
		}

		String adminEmail = seedAdminEmail == null ? "" : seedAdminEmail.trim().toLowerCase(Locale.ROOT);
		String adminLogin = seedAdminLogin == null ? "" : seedAdminLogin.trim();
		boolean loginExplicitlyConfigured = !adminLogin.isBlank();
		String adminPassword = seedAdminPassword == null ? "" : seedAdminPassword;

		if (adminEmail.isBlank() || adminPassword.isBlank()) {
			LOG.warn("seed.admin.enabled=true but seed.admin.email or seed.admin.password is blank; skipping admin bootstrap");
			return;
		}

		if (!STRONG_PASSWORD_PATTERN.matcher(adminPassword).matches()) {
			LOG.warn("seed.admin.password does not meet password policy; skipping admin bootstrap");
			return;
		}

		if (adminLogin.isBlank()) {
			adminLogin = deriveLoginFromEmail(adminEmail);
		}

		final String resolvedAdminEmail = adminEmail;
		final String resolvedAdminLogin = adminLogin;
		final String resolvedAdminPassword = adminPassword;
		final boolean resolvedLoginExplicitlyConfigured = loginExplicitlyConfigured;

		QuarkusTransaction.requiringNew().run(() -> {
			User userByEmail = userRepository.findByEmail(resolvedAdminEmail).orElse(null);
			User userByLogin = resolvedLoginExplicitlyConfigured
				? userRepository.findByUsername(resolvedAdminLogin).orElse(null)
				: null;

			if (userByEmail == null && userByLogin != null) {
				LOG.error("Cannot bootstrap admin user because configured login belongs to another account");
				return;
			}

			if (userByEmail != null && userByLogin != null && !userByEmail.id.equals(userByLogin.id)) {
				LOG.error("Cannot bootstrap admin user due to email/login conflict");
				return;
			}

			User adminUser = userByEmail != null ? userByEmail : userByLogin;
			if (adminUser == null) {
				String loginToUse = resolvedAdminLogin;
				if (userRepository.findByUsername(loginToUse).isPresent()) {
					loginToUse = userService.generateUsername(loginToUse);
				}

				adminUser = new User();
				adminUser.email = resolvedAdminEmail;
				adminUser.username = loginToUse;
				adminUser.fullName = "Admin";
				adminUser.role = UserRole.ADMIN;
				adminUser.isBanned = false;
				adminUser.passwordHash = passwordService.hash(resolvedAdminPassword);
				userRepository.persist(adminUser);
				LOG.info("Bootstrapped admin user");
				return;
			}

			adminUser.email = resolvedAdminEmail;
			if (resolvedLoginExplicitlyConfigured) {
				adminUser.username = resolvedAdminLogin;
			}
			adminUser.role = UserRole.ADMIN;
			adminUser.isBanned = false;
			adminUser.passwordHash = passwordService.hash(resolvedAdminPassword);
			userRepository.persist(adminUser);
			LOG.info("Ensured configured admin user state");
		});
	}

	private String deriveLoginFromEmail(String adminEmail) {
		String localPart = adminEmail;
		int atIndex = adminEmail.indexOf('@');
		if (atIndex > 0) {
			localPart = adminEmail.substring(0, atIndex);
		}

		String candidate = localPart.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
		if (candidate.isBlank()) {
			candidate = "seedadmin";
		}

		return candidate;
	}

	public void loadSeedFile() {
		File file = new File(seedFilePath);
		if (!file.exists()) {
			LOG.error("No seed file found at: " + seedFilePath);
			return;
		}
		if (file.isDirectory()) {
			LOG.error("Seed file path points to a directory, expected a file: " + seedFilePath);
			return;
		}
		try {
			IntraDTO[] data = objectMapper.readValue(file, IntraDTO[].class);
			if (data == null) {
				LOG.error("Seed file unavailable. Continuing startup without seeding.");
				return;
			}

			for (IntraDTO dto : data) {
				persistSeedUser(dto);
			}
			LOG.info("Seeded " + data.length + " users from file");
		} catch (IOException e) {
			LOG.error("Failed to read/parse seed file", e);
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
			persistSeedUser(dto);
		}
		saveSeedFile(new ArrayList<>(deduplicated.values()));
		LOG.info("Seeded " + deduplicated.size() + " users from 42 API");
	}

	private void persistSeedUser(IntraDTO dto) {
		QuarkusTransaction.requiringNew().run(() -> upsertSeedUser(dto));
	}

	public void saveSeedFile(List<IntraDTO> data) {
		try {
			File file = new File(seedFilePath);
			file.getParentFile().mkdirs();
			objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, data);
			LOG.debug("Saved seed data file");
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
