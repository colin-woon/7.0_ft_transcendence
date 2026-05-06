package org.acme.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import org.acme.dto.IntraDTO;
import org.acme.dto.SeedRecordDTO;
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

/**
 * Handles startup seeding from FILE, LOGINS, or CAMPUS modes.
 * SEED_TEST mode: Password is hashed and stored in User database during seeding,
 * but is NOT persisted to seed_file.json (only on-memory during seeding transaction).
 */
@ApplicationScoped
public class SeedService {
	private static final Logger LOG = Logger.getLogger(SeedService.class);
	private static final String CLASSPATH_PREFIX = "classpath:";
	private static final String UNSET_SENTINEL = "__unset__";
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
	SeedPersistenceService seedPersistenceService;

	@Inject
	PasswordService passwordService;

	@ConfigProperty(name = "seed.mode", defaultValue = "off")
	SeedMode seedMode;

	@ConfigProperty(name = "seed.file", defaultValue = "/var/lib/auth/seed/seed_file.json")
	String seedFilePath;

	@ConfigProperty(name = "seed.logins", defaultValue = "")
	String seedLoginsRaw;

	@ConfigProperty(name = "seed.campus", defaultValue = "")
	String seedCampus;

	@ConfigProperty(name = "seed.admin.enabled", defaultValue = "false")
	boolean seedAdminEnabled;

	@ConfigProperty(name = "seed.admin.email", defaultValue = "")
	String seedAdminEmail;

	@ConfigProperty(name = "seed.admin.login", defaultValue = "")
	String seedAdminLogin;

	@ConfigProperty(name = "seed.admin.password", defaultValue = "")
	String seedAdminPassword;

	@ConfigProperty(name = "seed.test", defaultValue = "false")
	boolean seedTest;

	@ConfigProperty(name = "seed.test.pass", defaultValue = "__unset__")
	String seedTestPassword;

	@ConfigProperty(name = "seed.limit", defaultValue = "50")
	int seedLimit;

	public void onStart(@Observes StartupEvent ev) {
		ensureSeedAdminUser();
		LOG.info("Seed mode: " + seedMode);
		try {
			switch (seedMode) {
				case OFF -> {}
				case FILE -> loadSeedFile();
				case LOGINS -> seedFromApiLogins();
				case CAMPUS -> seedFromApiCampus();
			}
		} catch (Exception e) {
			LOG.error("Fatal seeding error, startup interrupted", e);
			throw new RuntimeException("Seeding failed", e);
		}
	}

	private void ensureSeedAdminUser() {
		if (!seedAdminEnabled) {
			return;
		}

		String adminEmail = normalizeSeedValue(seedAdminEmail).toLowerCase(Locale.ROOT);
		String adminLogin = normalizeSeedValue(seedAdminLogin);
		boolean loginExplicitlyConfigured = !adminLogin.isBlank();
		String adminPassword = normalizeSeedValue(seedAdminPassword);

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
			User userByEmail = userRepository.findByOverflowEmail(resolvedAdminEmail).orElse(null);
			User userByLogin = resolvedLoginExplicitlyConfigured
				? userRepository.findByUsername(resolvedAdminLogin).orElse(null)
				: null;

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
				adminUser.overflowEmail = resolvedAdminEmail;
				adminUser.username = loginToUse;
				adminUser.fullName = "Admin";
				adminUser.role = UserRole.ADMIN;
				adminUser.isBanned = false;
				adminUser.passwordHash = passwordService.hash(resolvedAdminPassword);
				userRepository.persist(adminUser);
				LOG.info("Bootstrapped admin user");
				return;
			}

			adminUser.overflowEmail = resolvedAdminEmail;
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

	private String normalizeSeedValue(String value) {
		if (value == null) {
			return "";
		}

		String trimmed = value.trim();
		if (trimmed.isBlank() || UNSET_SENTINEL.equalsIgnoreCase(trimmed)) {
			return "";
		}

		return trimmed;
	}

	/**
	 * Loads seed records from the configured seed path and applies upsert semantics.
	 */
	public void loadSeedFile() {
		if (isClasspathSeedPath()) {
			loadSeedFileFromClasspath();
			return;
		}

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
			seedFromData(readSeedRecords(file));
		} catch (IOException e) {
			LOG.error("Failed to read/parse seed file", e);
		}
	}

	private void loadSeedFileFromClasspath() {
		String resourcePath = resolveClasspathResourcePath();
		try (InputStream input = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath)) {
			if (input == null) {
				LOG.error("No seed classpath resource found at: " + resourcePath);
				return;
			}
			seedFromData(readSeedRecords(input));
		} catch (IOException e) {
			LOG.error("Failed to read/parse classpath seed file", e);
		}
	}

	/**
	 * Loads seed records and applies upsert semantics to database.
	 */
	private void seedFromData(List<SeedRecordDTO> data) {
		if (data == null || data.isEmpty()) {
			LOG.error("Seed data unavailable. Continuing startup without seeding.");
			return;
		}

		List<SeedRecordDTO> limited = limitSeedRecords(data);

		Map<String, SeedRecordDTO> deduplicated = deduplicateUsers(limited);
		if (deduplicated.size() != limited.size()) {
			LOG.info("Deduplicated seed file users from " + limited.size() + " to " + deduplicated.size());
		}

		int seeded = 0;
		for (SeedRecordDTO record : deduplicated.values()) {
			persistSeedUser(record);
			seeded++;
		}

		LOG.info("Seeded " + seeded + " users from seed file");
	}

	/**
	 * Seeds from explicit LOGINS configuration via 42 API.
	 */
	private void seedFromApiLogins() {
		String loginsRaw = normalizeSeedValue(seedLoginsRaw);
		if (loginsRaw.isBlank()) {
			LOG.warn("Seed mode LOGINS but no seed.logins configured");
			return;
		}

		String token = intraClientService.fetchClientToken();
		if (token == null) {
			LOG.error("Unable to access 42 API token for LOGINS seeding");
			return;
		}

		List<String> logins = Arrays.stream(loginsRaw.split(","))
			.map(String::trim)
			.filter(s -> !s.isBlank())
			.distinct()
			.toList();

		List<IntraDTO> fetched = new ArrayList<>();
		for (String login : logins) {
			if (fetched.size() >= seedLimit) {
				LOG.info("Reached seed limit of " + seedLimit + " users for LOGINS mode");
				break;
			}
			try {
				IntraDTO dto = intraClientService.fetchUser(token, login);
				if (dto != null) {
					fetched.add(dto);
					LOG.debug("Fetched user: " + login);
				} else {
					LOG.warn("User not found in 42 API: " + login);
				}
			} catch (Exception e) {
				LOG.warn("Failed to fetch user from 42 API: " + login, e);
			}
		}

		seedFetchedChunk(fetched, "42 API logins", seedLimit);
	}

	/**
	 * Seeds from campus list via 42 API with pagination support.
	 */
	private void seedFromApiCampus() {
		String campusRaw = normalizeSeedValue(seedCampus);
		if (campusRaw.isBlank()) {
			LOG.warn("Seed mode CAMPUS but no seed.campus configured");
			return;
		}

		String token = intraClientService.fetchClientToken();
		if (token == null) {
			LOG.error("Unable to access 42 API token for CAMPUS seeding");
			return;
		}

		List<String> campuses = Arrays.stream(campusRaw.split(","))
			.map(String::trim)
			.filter(s -> !s.isBlank())
			.distinct()
			.toList();

		List<String> campusIds = intraClientService.fetchCampusIds(token, campuses).stream()
			.distinct()
			.toList();

		if (campusIds.isEmpty()) {
			LOG.warn("No valid campus IDs found for configured campuses: " + campusRaw);
			return;
		}

		AtomicInteger totalSeeded = new AtomicInteger();
		for (String campusId : campusIds) {
			if (totalSeeded.get() >= seedLimit) {
				LOG.info("Reached seed limit of " + seedLimit + " users for CAMPUS mode");
				break;
			}
			try {
				AtomicInteger seededThisCampus = new AtomicInteger();
				List<IntraDTO> users = intraClientService.fetchUsersByCampus(token, campusId, (pageNumber, pageUsers) -> {
					int remaining = seedLimit - totalSeeded.get() - seededThisCampus.get();
					if (remaining <= 0) {
						return;
					}
					int seededThisPage = seedFetchedChunk(pageUsers, "42 API campus " + campusId + " page " + pageNumber, remaining);
					seededThisCampus.addAndGet(seededThisPage);
					LOG.info("Seed checkpoint complete for campus " + campusId + " page " + pageNumber + ": " + seededThisPage + " users");
				});
				totalSeeded.addAndGet(seededThisCampus.get());
				if (users.isEmpty()) {
					LOG.warn("No users fetched for campus " + campusId);
				}
				LOG.info("Seed checkpoint complete for campus " + campusId + ": " + seededThisCampus.get() + " users");
			} catch (Exception e) {
				LOG.error("Failed to seed campus " + campusId, e);
			}
		}

		if (totalSeeded.get() == 0) {
			LOG.warn("No users fetched from 42 API campuses");
		} else {
			LOG.info("Seeded total " + totalSeeded.get() + " users from 42 API campuses");
		}
	}

	/**
	 * Processes a chunk of fetched IntraDTO records: persist to DB and merge into seed file.
	 */
	private int seedFetchedChunk(List<IntraDTO> fetched, String sourceLabel, int remainingSeedLimit) {
		if (fetched == null || fetched.isEmpty()) {
			LOG.warn("No users fetched from " + sourceLabel);
			return 0;
		}

		List<SeedRecordDTO> fetchedRecords = fetched.stream()
			.map(this::toSeedRecord)
			.toList();

		Map<String, SeedRecordDTO> deduplicated = deduplicateUsers(fetchedRecords);
		if (deduplicated.size() != fetched.size()) {
			LOG.info("Deduplicated seeded users from " + fetched.size() + " to " + deduplicated.size());
		}

		List<SeedRecordDTO> limited = new ArrayList<>(Math.min(deduplicated.size(), Math.max(remainingSeedLimit, 0)));
		int count = 0;
		for (SeedRecordDTO record : deduplicated.values()) {
			if (count >= remainingSeedLimit) {
				break;
			}
			persistSeedUser(record);
			limited.add(record);
			count++;
		}

		// Merge into seed file (without SEED_TEST password, which is only for DB)
		saveSeedFileMerged(limited);
		LOG.info("Seeded " + count + " users from " + sourceLabel);
		return count;
	}

	private void persistSeedUser(SeedRecordDTO record) {
		seedPersistenceService.upsertSeedUser(record, seedTest, seedTestPassword);
	}

	/**
	 * Saves seed records to file (without SEED_TEST passwords).
	 */
	public void saveSeedFile(List<SeedRecordDTO> data) {
		if (isClasspathSeedPath()) {
			LOG.warn("Skipping seed file write for classpath seed path: " + seedFilePath);
			return;
		}

		try {
			File file = new File(seedFilePath);
			File parent = file.getParentFile();
			if (parent != null) {
				parent.mkdirs();
			}
			objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, data);
			LOG.info("Saved seed file with " + data.size() + " records");
		} catch (IOException e) {
			LOG.error("Failed to save seed file", e);
		}
	}

	/**
	 * Merges new records into the seed file using newest-write-wins deduplication.
	 */
	public void saveSeedFileMerged(List<SeedRecordDTO> newData) {
		List<SeedRecordDTO> existingData = readSeedFileData();
		List<SeedRecordDTO> combinedData = new ArrayList<>(existingData.size() + newData.size());
		combinedData.addAll(existingData);
		combinedData.addAll(newData);

		Map<String, SeedRecordDTO> deduplicated = deduplicateUsers(combinedData);
		if (deduplicated.size() != combinedData.size()) {
			LOG.info("Deduplicated merged seed file users from " + combinedData.size() + " to " + deduplicated.size());
		}

		List<SeedRecordDTO> limited = limitSeedRecords(new ArrayList<>(deduplicated.values()));
		saveSeedFile(limited);
	}

	private List<SeedRecordDTO> limitSeedRecords(List<SeedRecordDTO> records) {
		if (records == null || records.isEmpty()) {
			return List.of();
		}

		if (records.size() <= seedLimit) {
			return records;
		}

		LOG.info("Limiting seed records from " + records.size() + " to " + seedLimit);
		return new ArrayList<>(records.subList(0, seedLimit));
	}

	private List<SeedRecordDTO> readSeedFileData() {
		if (isClasspathSeedPath()) {
			LOG.debug("Skipping seed file merge read for classpath seed path: " + seedFilePath);
			return List.of();
		}

		File file = new File(seedFilePath);
		if (!file.exists() || !file.isFile() || file.length() == 0) {
			return List.of();
		}

		try {
			return readSeedRecords(file);
		} catch (IOException e) {
			LOG.warn("Failed to read existing seed file before merge; writing with new data only", e);
			return List.of();
		}
	}

	private boolean isClasspathSeedPath() {
		return seedFilePath != null && seedFilePath.startsWith(CLASSPATH_PREFIX);
	}

	private String resolveClasspathResourcePath() {
		String resourcePath = seedFilePath.substring(CLASSPATH_PREFIX.length());
		while (resourcePath.startsWith("/")) {
			resourcePath = resourcePath.substring(1);
		}
		return resourcePath;
	}

	/**
	 * Deduplicates by strongest identity key (intra id, email, then login), last record wins.
	 */
	private Map<String, SeedRecordDTO> deduplicateUsers(List<SeedRecordDTO> users) {
		Map<String, SeedRecordDTO> deduplicated = new LinkedHashMap<>();
		for (SeedRecordDTO record : users) {
			if (record == null) {
				continue;
			}

			String key = buildRecordKey(record);

			if (key != null) {
				deduplicated.put(key, record);
			}
		}
		return deduplicated;
	}

	private String buildRecordKey(SeedRecordDTO record) {
		if (record.intra != null && record.intra.intraId != null && !record.intra.intraId.isBlank()) {
			return "id:" + record.intra.intraId.trim();
		}
		if (record.user != null && record.user.intraId != null && !record.user.intraId.isBlank()) {
			return "id:" + record.user.intraId.trim();
		}
		if (record.user != null && record.user.email != null && !record.user.email.isBlank()) {
			return "email:" + record.user.email.trim().toLowerCase(Locale.ROOT);
		}
		if (record.user != null && record.user.username != null && !record.user.username.isBlank()) {
			return "login:" + record.user.username.trim().toLowerCase(Locale.ROOT);
		}
		return null;
	}

	/**
	 * Creates or updates a user and its compact intra payload from one seed record.
	 * IMPORTANT: SEED_TEST password is applied ONLY in-memory to User database object,
	 * NOT to the SeedRecordDTO which will be saved to seed_file.json.
	 */
	// The upsertSeedUser method has been removed and its logic is now handled by SeedPersistenceService.

	private String firstNonBlank(String primary, String fallback) {
		if (primary != null && !primary.isBlank()) {
			return primary;
		}
		if (fallback != null && !fallback.isBlank()) {
			return fallback;
		}
		return null;
	}

	private SeedRecordDTO toSeedRecord(IntraDTO dto) {
		SeedRecordDTO record = new SeedRecordDTO();
		record.user = new SeedRecordDTO.SeedUserData();
		record.intra = intraService.toSeedIntraData(dto);

		record.user.email = dto.email;
		record.user.intraId = dto.id != null ? dto.id.toString() : null;
		record.user.username = dto.login;
		record.user.fullName = firstNonBlank(dto.usualFullName, dto.displayName);
		record.user.bio = null;
		record.user.role = dto.isStaff ? UserRole.ADMIN.name() : UserRole.STUDENT.name();
		record.user.isBanned = false;

		return record;
	}

	/**
	 * Reads seed records with backward compatibility for legacy IntraDTO arrays.
	 */
	private List<SeedRecordDTO> readSeedRecords(File file) throws IOException {
		try (InputStream in = java.nio.file.Files.newInputStream(file.toPath())) {
			return readSeedRecords(in);
		}
	}

	private List<SeedRecordDTO> readSeedRecords(InputStream input) throws IOException {
		byte[] bytes = input.readAllBytes();
		if (bytes.length == 0) {
			return List.of();
		}

		try {
			SeedRecordDTO[] records = objectMapper.readValue(bytes, SeedRecordDTO[].class);
			if (records == null || records.length == 0) {
				return List.of();
			}
			return Arrays.stream(records)
				.filter(r -> r != null && r.user != null && r.intra != null)
				.toList();
		} catch (IOException firstParseFailure) {
			try {
				IntraDTO[] legacy = objectMapper.readValue(bytes, IntraDTO[].class);
				if (legacy == null || legacy.length == 0) {
					return List.of();
				}
				LOG.warn("Loaded legacy seed file format; rewriting in compact nested format on next merge/save");
				return Arrays.stream(legacy).map(this::toSeedRecord).toList();
			} catch (IOException secondParseFailure) {
				String payload = new String(bytes, StandardCharsets.UTF_8);
				throw new IOException("Invalid seed file format, expected compact nested records. payload-start="
					+ payload.substring(0, Math.min(payload.length(), 120)), secondParseFailure);
			}
		}
	}
}
