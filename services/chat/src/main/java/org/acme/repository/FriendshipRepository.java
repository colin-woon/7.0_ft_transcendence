package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.model.Friendship;
import org.acme.model.FriendshipId;

@ApplicationScoped
public class FriendshipRepository implements PanacheRepositoryBase<Friendship, FriendshipId> {
    //can add custom functions for api calls later, like find all friends etc
}