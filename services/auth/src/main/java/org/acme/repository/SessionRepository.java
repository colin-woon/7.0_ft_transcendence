package org.acme.repository;

import java.util.Optional;

import org.acme.model.Session;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SessionRepository implements PanacheRepository<Session> {

	public Optional<Session> findBySessionId(String sessionId) {
		return find("sessionId", sessionId).firstResultOptional();
	}

	public Optional<Session> findByUserId(Long userId) {
		return find("userId", userId).firstResultOptional();
	}

	public long countByUserId(Long userId) {
		return count("userId", userId);
	}

	public Optional<Session> findOldestByUserId(Long userId) {
		return find("userId = ?1", Sort.by("createdAt").ascending(), userId).firstResultOptional();
	}

	public long deleteByUserId(Long userId) {
		return delete("userId", userId);
	}
}
