package org.acme.service;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PasswordService {

	private final Argon2 argon2;

	@ConfigProperty(name = "auth.password.argon2.iterations", defaultValue = "3")
	int iterations;

	@ConfigProperty(name = "auth.password.argon2.memory-kb", defaultValue = "65536")
	int memoryKb;

	@ConfigProperty(name = "auth.password.argon2.parallelism", defaultValue = "1")
	int parallelism;

	public PasswordService() {
		this.argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
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
}
