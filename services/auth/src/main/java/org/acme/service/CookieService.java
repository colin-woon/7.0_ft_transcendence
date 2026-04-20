package org.acme.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.NewCookie;

@ApplicationScoped
public class CookieService {

	// Keep cookie names centralized to avoid drift across services.
	private static final String SESSION_COOKIE = "sessionId";
	private static final String ACCESS_COOKIE = "accessToken";
	
	@ConfigProperty(name = "app.domain.name", defaultValue = "localhost")
	String domain;

	@ConfigProperty(name = "refresh.expiry", defaultValue = "86400")
	Long refreshExpiry;

	@ConfigProperty(name = "access.expiry", defaultValue = "600")
	Long accessExpiry;

	@ConfigProperty(name = "secure.cookies", defaultValue = "false")
	Boolean secureCookies;

	public Duration accessTokenLifetime() {
		return Duration.ofSeconds(accessExpiry);
	}

	public Duration sessionLifetime() {
		return Duration.ofSeconds(refreshExpiry);
	}
	
	private boolean shouldUseDomainCookie() {
		if (domain == null) {
			return false;
		}

		String normalized = domain.trim().toLowerCase();
		if (normalized.isEmpty() || "localhost".equals(normalized)) {
			return false;
		}

		// Avoid Domain cookies for raw IPs and invalid hostnames.
		if (normalized.matches("^\\d{1,3}(?:\\.\\d{1,3}){3}$") || normalized.contains(":")) {
			return false;
		}

		return normalized.contains(".");
	}

	private NewCookie.Builder baseCookieBuilder(String name) {
		NewCookie.Builder builder = new NewCookie.Builder(name)
			.path("/")
			.sameSite(NewCookie.SameSite.LAX)
			.secure(secureCookies)
			.httpOnly(true);

		if (shouldUseDomainCookie()) {
			builder.domain(domain);
		}

		return builder;
	}

	public NewCookie createSessionCookie(String sessionId, Instant expiry) {
		return baseCookieBuilder(SESSION_COOKIE)
			.value(sessionId)
			.expiry(Date.from(expiry))
			.maxAge(Math.toIntExact(sessionLifetime().toSeconds()))
			.comment("Session id used for refresh token flow")
			.build();
	}
	
	public NewCookie createAccessTokenCookie(String accessToken) {
		return baseCookieBuilder(ACCESS_COOKIE)
			.value(accessToken)
			.expiry(Date.from(Instant.now().plus(accessTokenLifetime())))
			.maxAge(Math.toIntExact(accessTokenLifetime().toSeconds()))
			.comment("The access token for websocket and SSE use")
			.build();
	}

	public NewCookie[] clearOIDCCookies() {
		List<NewCookie> cookies = new ArrayList<>();
		Collections.addAll(cookies, clearCookieVariants("q_session"));
		Collections.addAll(cookies, clearCookieVariants("q_session_google"));
		Collections.addAll(cookies, clearCookieVariants("q_session_42"));
		return cookies.toArray(NewCookie[]::new);
	}

	private NewCookie buildClearingCookie(String name, boolean withDomain) {
		NewCookie.Builder builder = new NewCookie.Builder(name)
			.value("")
			.path("/")
			// Max-Age=0 + Epoch expiry gives broad browser compatibility for forced deletion.
			.expiry(Date.from(Instant.EPOCH))
			.maxAge(0)
			.sameSite(NewCookie.SameSite.LAX)
			.secure(secureCookies)
			.httpOnly(true);

		if (withDomain && shouldUseDomainCookie()) {
			builder.domain(domain);
		}

		return builder.build();
	}

	private NewCookie[] clearCookieVariants(String name) {
		if (shouldUseDomainCookie()) {
			return new NewCookie[] {
				buildClearingCookie(name, true),
				buildClearingCookie(name, false),
			};
		}

		return new NewCookie[] { buildClearingCookie(name, false) };
	}
	
	public NewCookie[] clearSessionCookies() {
		return clearCookieVariants(SESSION_COOKIE);
	}

	public NewCookie[] clearAccessTokenCookies() {
		return clearCookieVariants(ACCESS_COOKIE);
	}

	public NewCookie[] clearAuthCookies() {
		List<NewCookie> cookies = new ArrayList<>();
		Collections.addAll(cookies, clearSessionCookies());
		Collections.addAll(cookies, clearAccessTokenCookies());
		return cookies.toArray(NewCookie[]::new);
	}
}
