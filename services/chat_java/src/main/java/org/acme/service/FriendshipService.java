package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import org.acme.model.FriendStatus;
import org.acme.model.Friendship;
import org.acme.model.FriendshipId;
import org.acme.repository.FriendshipRepository;

@ApplicationScoped
public class FriendshipService {

	@Inject
    FriendshipRepository friendshipRepository;

	@Transactional
    public void sendFriendRequest(Integer requesterId, Integer addresseeId) {
        // Create the composite key
        FriendshipId id = new FriendshipId(requesterId, addresseeId);
        // Check if exists
        if (friendshipRepository.findById(id) != null) {
            throw new WebApplicationException("Friendship already exists", 409);
        }

        Friendship friendship = new Friendship();
        friendship.id = id;
        // Status defaults to PENDING in the Entity, so we just persist
        friendshipRepository.persist(friendship);
    }

    @Transactional
    public void acceptFriendRequest(Integer requesterId, Integer addresseeId)
    {
        FriendshipId id = new FriendshipId(requesterId, addresseeId);
        Friendship friendship = friendshipRepository.findById(id);
        if (friendship == null)
        {
            throw new WebApplicationException("Friend request not found", 404);
        }
        friendship.status = FriendStatus.ACCEPTED;
    }
}