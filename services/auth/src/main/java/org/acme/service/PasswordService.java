package org.acme.service;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PasswordService {

	private final Argon2 argon2;

	private final int iterations = 3;
	private final int memoryKb = 65536;
	private final int parallelism = 1;

	private String dummyHash;

	public PasswordService() {
		this.argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
	}

	@PostConstruct
	@SuppressWarnings("unused")
	void init() {
		// Used to normalize verification timing for unknown users or non-password accounts.
		dummyHash = hash("bumintra-dummy-password");
	}

	public String hash(String password) {
		char[] passwordChars = password.toCharArray();
		try {
			return argon2.hash(iterations, memoryKb, parallelism, passwordChars);
		} finally {
			argon2.wipeArray(passwordChars);
		}
	}

	public boolean verify(String rawPassword, String storedHash) {
		char[] passwordChars = rawPassword.toCharArray();
		try {
			return argon2.verify(storedHash, passwordChars);
		} finally {
			argon2.wipeArray(passwordChars);
		}
	}

	public boolean verifyWithFallback(String rawPassword, String storedHash) {
		String hashToVerify = (storedHash == null || storedHash.isBlank()) ? dummyHash : storedHash;
		boolean matches = verify(rawPassword, hashToVerify);
		return storedHash != null && !storedHash.isBlank() && matches;
	}
}
