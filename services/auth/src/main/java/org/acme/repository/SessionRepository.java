package org.acme.repository;

import java.util.Optional;
import java.util.List;

import org.acme.model.Session;
import org.eclipse.jdt.annotation.NonNull;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SessionRepository implements PanacheRepository<Session> {

	public Optional<Session> findBySessionId(String sessionId) {
		return find("sessionId", sessionId).firstResultOptional();
	}

	public List<@NonNull Session> findByUserId(Long userId) {
		return find("userId", userId).list();
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
