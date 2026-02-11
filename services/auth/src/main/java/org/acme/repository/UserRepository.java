// userrepository handles db queries with panache

package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.model.User;
import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    // can use standard methods (persist, delete, listAll) for free

    public Optional<User> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public Optional<User> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }
}