package org.bumIntra.gateway.security.ratelimit;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.runtime.Startup;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

@Startup
@ApplicationScoped
public class RedisScriptRegistry {

	private static final String LUA_SCRIPT = "redis/token_bucket.lua";

	@Inject
	RedisDataSource redis;

	private final AtomicReference<String> tokenBucketSha = new AtomicReference<>();

	void onStart(@Observes StartupEvent ev) {
		loadTokenBucketScript();
	}

	public String tokenBucketSha() {
		String sha = tokenBucketSha.get();
		// Standard double-checked locking is safer if multiple threads
		// hit this before the first load finishes.
		if (sha == null) {
			synchronized (this) {
				sha = tokenBucketSha.get();
				if (sha == null) {
					sha = loadTokenBucketScript();
				}
			}
		}
		return sha;
	}

	public String reloadTokenBucketScript() {
		return loadTokenBucketScript();
	}

	private String loadTokenBucketScript() {
		String script = readClasspath(LUA_SCRIPT);

		String sha = redis.execute("SCRIPT", "LOAD", script).toString();

		tokenBucketSha.set(sha);
		return sha;
	}

	private static String readClasspath(String path) {
		try (var in = Thread.currentThread()
				.getContextClassLoader()
				.getResourceAsStream(path)) {

			if (in == null) {
				throw new IllegalStateException("Missing lua script: " + path);
			}
			return new String(in.readAllBytes(), StandardCharsets.UTF_8);
		} catch (Exception e) {
			throw new IllegalStateException("Failed to read lua script: " + path, e);
		}
	}
}
