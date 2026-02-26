package org.acme.repository;

import org.acme.model.Session;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class SessionRepository implements PanacheRepository<Session> {

	public Optional<Session> findBySessionId(String sessionId) {
		return find("sessionId", sessionId).firstResultOptional();
	}

	public Optional<Session> findByUserId(Long userId) {
		return find("userId", userId).firstResultOptional();
	}

}
