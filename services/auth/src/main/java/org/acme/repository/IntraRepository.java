package org.acme.repository;

import java.util.Optional;

import org.acme.model.Intra;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class IntraRepository implements PanacheRepository<Intra> {
    // can use standard methods (persist, delete, listAll) for free

	public Optional<Intra> findByUserId(Long userId) {
        return find("user.id", userId).firstResultOptional();
    }
}
