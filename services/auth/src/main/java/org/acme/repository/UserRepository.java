package org.acme.repository;

import java.util.List;
import java.util.Optional;

import org.acme.dto.UserSummaryDTO;
import org.acme.model.User;
import org.acme.model.UserRole;
import org.eclipse.jdt.annotation.NonNull;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    // can use standard methods (persist, delete, listAll) for free

    public Optional<User> findByOverflowEmail(String overflowEmail) {
        return find("overflowEmail", overflowEmail).firstResultOptional();
    }

    public Optional<User> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }
    
    public Optional<User> findByFullName(String fullName) {
        return find("fullName", fullName).firstResultOptional();
    }

    public Optional<User> findByGoogleId(String googleId) {
        return find("googleId", googleId).firstResultOptional();
    }

    public Optional<User> findByGoogleEmail(String googleEmail) {
        return find("googleEmail", googleEmail).firstResultOptional();
    }
    
    public Optional<User> findByIntraId(String intraId) {
        return find("intraId", intraId).firstResultOptional();
    }

    public Optional<User> findByIntraEmail(String intraEmail) {
        return find("intraEmail", intraEmail).firstResultOptional();
    }

    public List<@NonNull UserSummaryDTO> searchByName(String query, int pageIndex, int pageSize) {
        return find("LOWER(username) LIKE ?1 OR LOWER(fullName) LIKE ?1", 
                    "%" + query.toLowerCase() + "%")
                .project(UserSummaryDTO.class)
                .page(pageIndex, pageSize)
                .list();
    }

    public List<@NonNull UserSummaryDTO> searchByName(String query, int pageIndex, int pageSize, UserRole role) {
        return find("(LOWER(username) LIKE ?1 OR LOWER(fullName) LIKE ?1) AND role = ?2", 
                    "%" + query.toLowerCase() + "%", role)
                .project(UserSummaryDTO.class)
                .page(pageIndex, pageSize)
                .list();
    }

    public List<@NonNull User> findByIdsWithIntra(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }

        return find("from User u left join fetch u.intra where u.id in ?1", userIds).list();
    }
}
