package org.bumIntra.gateway.security;

import java.time.Instant;

public record TokenRefreshResult(String accessToken, Instant expiresAt, String setCookieHeader) {
}
