package org.acme.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.acme.dto.IntraDTO;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class IntraClientService {
	private static final Logger LOG = Logger.getLogger(IntraClientService.class);

	private static final String FT_TOKEN_URL = "https://api.intra.42.fr/oauth/token";
	private static final String FT_USER_URL = "https://api.intra.42.fr/v2/users/";
	private static final String FT_ME_URL = "https://api.intra.42.fr/v2/me";
	private static final String FT_CAMPUSES_URL = "https://api.intra.42.fr/v2/campus";
	private static final int PAGE_SIZE = 100;

	@ConfigProperty(name = "ft.client.id", defaultValue = "")
	String ftClientId;

	@ConfigProperty(name = "ft.client.secret", defaultValue = "")
	String ftClientSecret;

	@ConfigProperty(name = "ft.api.retry.max-attempts", defaultValue = "4")
	int maxAttempts;

	@ConfigProperty(name = "ft.api.retry.base-delay-seconds", defaultValue = "30")
	long baseDelaySeconds;

	@ConfigProperty(name = "ft.api.retry.max-delay-seconds", defaultValue = "120")
	long maxDelaySeconds;

	@Inject
	ObjectMapper objectMapper;

	private static final HttpClient httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();

	public String fetchClientToken() {
		if (ftClientId == null || ftClientId.isBlank() || ftClientSecret == null || ftClientSecret.isBlank()) {
			LOG.error("42 API credentials are missing. Set FT_CLIENT_ID and FT_CLIENT_SECRET.");
			return null;
		}
		try {
			String body = "grant_type=client_credentials"
				+ "&client_id=" + URLEncoder.encode(ftClientId, StandardCharsets.UTF_8)
				+ "&client_secret=" + URLEncoder.encode(ftClientSecret, StandardCharsets.UTF_8);

			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(FT_TOKEN_URL))
				.header("Content-Type", "application/x-www-form-urlencoded")
				.POST(HttpRequest.BodyPublishers.ofString(body))
				.build();

			HttpResponse<String> response = sendWithRetry(request, "fetch 42 API token");
			if (response == null) {
				return null;
			}

			if (response.statusCode() != 200) {
				LOG.error("42 API token request failed: HTTP " + response.statusCode());
				return null;
			}

			return objectMapper.readTree(response.body()).get("access_token").asText();
		} catch (IOException e) {
			LOG.error("Failed to obtain 42 API token", e);
			return null;
		}
	}

	public IntraDTO fetchUser(String token, String login) {
		if (login == null || login.isBlank()) {
			LOG.warn("fetchUser called without login. '/v2/me' requires a user token; use fetchCurrentUser instead.");
			return null;
		}

		try {
			URI uri = URI.create(FT_USER_URL + URLEncoder.encode(login, StandardCharsets.UTF_8));
			HttpRequest request = HttpRequest.newBuilder()
				.uri(uri)
				.header("Authorization", "Bearer " + token)
				.GET()
				.build();

			HttpResponse<String> response = sendWithRetry(request, "fetch user '" + login + "'");
			if (response == null) {
				return null;
			}

			if (response.statusCode() != 200) {
				LOG.warn("Failed to fetch user '" + login + "': HTTP " + response.statusCode());
				return null;
			}

			return objectMapper.readValue(response.body(), IntraDTO.class);
		} catch (IOException e) {
			LOG.error("Failed to fetch user from 42 API: " + login, e);
			return null;
		}
	}

	public IntraDTO fetchCurrentUser(String userToken) {
		try {
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(FT_ME_URL))
				.header("Authorization", "Bearer " + userToken)
				.GET()
				.build();

			HttpResponse<String> response = sendWithRetry(request, "fetch current 42 user");
			if (response == null) {
				return null;
			}

			if (response.statusCode() != 200) {
				LOG.warn("Failed to fetch current user '/v2/me': HTTP " + response.statusCode());
				return null;
			}

			return objectMapper.readValue(response.body(), IntraDTO.class);
		} catch (IOException e) {
			LOG.error("Failed to fetch current user from 42 API", e);
			return null;
		}
	}

	public List<IntraDTO> fetchUsersByCampus(String token, String campus) {
		List<IntraDTO> result = new ArrayList<>();
		int pageNumber = 1;

		if (campus == null || campus.isBlank()) {
			return List.of();
		}

		try {
			while (true) {
				String uri = FT_CAMPUSES_URL + "/" + URLEncoder.encode(campus, StandardCharsets.UTF_8)
					+ "/users?page[size]=" + PAGE_SIZE + "&page[number]=" + pageNumber;

				HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(uri))
					.header("Authorization", "Bearer " + token)
					.GET()
					.build();

				HttpResponse<String> response = sendWithRetry(
					request,
					"fetch users for campus '" + campus + "' page " + pageNumber);
				if (response == null) {
					return result;
				}

				if (response.statusCode() != 200) {
					LOG.warn("Failed to fetch users for campus '" + campus + "' page " + pageNumber
						+ ": HTTP " + response.statusCode());
					return result;
				}

				List<IntraDTO> pageData = Arrays.asList(objectMapper.readValue(response.body(), IntraDTO[].class));
				if (pageData.isEmpty()) {
					break;
				}

				result.addAll(pageData);
				if (pageData.size() < PAGE_SIZE) {
					break;
				}

				pageNumber++;
			}

			return result;
		} catch (IOException e) {
			LOG.error("Failed to fetch users by campus from 42 API: " + campus, e);
			return result;
		}
	}

	public List<String> fetchCampusIds(String token, List<String> campusNames) {
		List<String> ids = new ArrayList<>();

		if (campusNames == null || campusNames.isEmpty()) {
			return ids;
		}

		try {
			for (String campusName : campusNames) {
				String uri = FT_CAMPUSES_URL + "?filter[name]="
					+ URLEncoder.encode(campusName, StandardCharsets.UTF_8)
					+ "&page[size]=100";

				HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(uri))
					.header("Authorization", "Bearer " + token)
					.GET()
					.build();

				HttpResponse<String> response = sendWithRetry(request, "fetch campus id for '" + campusName + "'");
				if (response == null) {
					continue;
				}

				if (response.statusCode() != 200) {
					LOG.warn("Failed to fetch campus id for '" + campusName + "': HTTP " + response.statusCode());
					continue;
				}

				JsonNode root = objectMapper.readTree(response.body());
				if (!root.isArray()) {
					LOG.warn("Unexpected campuses response shape for '" + campusName + "'");
					continue;
				}

				boolean found = false;
				for (JsonNode campusNode : root) {
					JsonNode idNode = campusNode.get("id");
					JsonNode nameNode = campusNode.get("name");
					if (idNode == null || nameNode == null || !idNode.canConvertToLong()) {
						continue;
					}

					String responseName = nameNode.asText("");
					if (!responseName.equalsIgnoreCase(campusName)) {
						continue;
					}

					String id = idNode.asText();
					if (!ids.contains(id)) {
						ids.add(id);
					}
					found = true;
					break;
				}

				if (!found) {
					LOG.warn("No campus id found for exact name: " + campusName);
				}
			}

			return ids;
		} catch (IOException e) {
			LOG.error("Failed to fetch campuses from 42 API", e);
			return ids;
		}
	}

	private HttpResponse<String> sendWithRetry(HttpRequest request, String operation) {
		for (int attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
				int statusCode = response.statusCode();

				if (!isRetryableStatus(statusCode) || attempt == maxAttempts) {
					return response;
				}

				long delayMillis = resolveRetryDelayMillis(response, attempt);
				LOG.warnf(
					"42 API %s failed with HTTP %d on attempt %d/%d. Retrying in %d seconds.",
					operation,
					statusCode,
					attempt,
					maxAttempts,
					delayMillis / 1000);

				if (!sleepBeforeRetry(delayMillis, operation)) {
					return null;
				}
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				LOG.error("Interrupted while " + operation, e);
				return null;
			} catch (IOException e) {
				if (attempt == maxAttempts) {
					LOG.error("Failed to " + operation + " after " + maxAttempts + " attempts", e);
					return null;
				}

				long delayMillis = resolveRetryDelayMillis(null, attempt);
				LOG.warnf(
					"42 API %s failed on attempt %d/%d due to %s. Retrying in %d seconds.",
					operation,
					attempt,
					maxAttempts,
					e.getClass().getSimpleName(),
					delayMillis / 1000);

				if (!sleepBeforeRetry(delayMillis, operation)) {
					return null;
				}
			}
		}

		return null;
	}

	private boolean isRetryableStatus(int statusCode) {
		return statusCode == 429
			|| statusCode == 500
			|| statusCode == 502
			|| statusCode == 503
			|| statusCode == 504;
	}

	private long resolveRetryDelayMillis(HttpResponse<String> response, int attempt) {
		if (response != null) {
			Optional<String> retryAfter = response.headers().firstValue("Retry-After");
			if (retryAfter.isPresent()) {
				try {
					long retryAfterSeconds = Long.parseLong(retryAfter.get().trim());
					return Math.max(1L, retryAfterSeconds) * 1000L;
				} catch (NumberFormatException ignored) {
					// Fall back to configured exponential backoff.
				}
			}
		}

		long delaySeconds = Math.min(baseDelaySeconds * attempt, maxDelaySeconds);
		return Math.max(1L, delaySeconds) * 1000L;
	}

	private boolean sleepBeforeRetry(long delayMillis, String operation) {
		try {
			Thread.sleep(delayMillis);
			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			LOG.error("Interrupted while waiting to retry " + operation, e);
			return false;
		}
	}
}
