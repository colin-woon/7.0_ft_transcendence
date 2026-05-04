package org.bumIntra.gateway.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

import org.bumIntra.gateway.client.AuthService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class GatewayTokenRefreshService {

    private final Map<String, CompletableFuture<TokenRefreshResult>> refreshMap = new ConcurrentHashMap<>();
    private final Map<String, RecentRefreshEntry> memoRefreshMap = new ConcurrentHashMap<>();

    @Inject
    AuthService authService;

    public CompletableFuture<TokenRefreshResult> refresh(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return CompletableFuture.failedFuture(
                    new IllegalArgumentException("sessionId is required for token refresh"));
        }

        RecentRefreshEntry recent = memoRefreshMap.get(sessionId);
        if (recent != null && recent.isFresh()) {
            return CompletableFuture.completedFuture(recent.result());
        }

        CompletableFuture<TokenRefreshResult> existing = refreshMap.get(sessionId);
        if (existing != null) {
            return existing;
        }

        CompletableFuture<TokenRefreshResult> created = new CompletableFuture<>();
        CompletableFuture<TokenRefreshResult> raced = refreshMap.putIfAbsent(sessionId, created);
        if (raced != null) {
            return raced;
        }

        try {
            TokenRefreshResult result = execute(sessionId);
            memoRefreshMap.put(sessionId, new RecentRefreshEntry(result, Instant.now()));
            created.complete(result);
        } catch (Exception e) {
            created.completeExceptionally(e);
        } finally {
            refreshMap.remove(sessionId, created);
        }

        return created;
    }

    private TokenRefreshResult execute(String sessionId) {
        try (Response response = authService.refresh(sessionId)) {
            if (response.getStatusInfo().getFamily() != Response.Status.Family.SUCCESSFUL) {
                throw new IllegalStateException(
                        "Auth refresh failed with status " + response.getStatus());
            }

            AuthRefreshResponse payload = response.readEntity(AuthRefreshResponse.class);
            if (payload == null || payload.accessToken == null || payload.accessToken.isBlank()) {
                throw new IllegalStateException("Auth refresh returned no access token");
            }

            return new TokenRefreshResult(
                    payload.accessToken,
                    payload.expiresIn,
                    response.getHeaderString(HttpHeaders.SET_COOKIE));
        }
    }

    private static class AuthRefreshResponse {
        public String accessToken;
        public Instant expiresIn;
    }

    private record RecentRefreshEntry(TokenRefreshResult result, Instant refreshedAt) {
        private boolean isFresh() {
            return refreshedAt != null
                    && Duration.between(refreshedAt, Instant.now()).compareTo(Duration.ofSeconds(1)) < 0;
        }
    }
}
