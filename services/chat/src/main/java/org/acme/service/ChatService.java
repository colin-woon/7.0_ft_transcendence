package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import org.acme.dto.MessageDTO;
import org.acme.model.Friendship;
import org.acme.model.FriendshipId;
import org.acme.model.Message;
import org.acme.repository.MessageRepository;
import org.acme.model.Friendship;
import org.acme.model.FriendshipId;
import org.acme.repository.FriendshipRepository;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ChatService {

    @Inject
    MessageRepository messageRepository;

	@Inject
    FriendshipRepository friendshipRepository;

    @Transactional
    public MessageDTO sendMessage(MessageDTO dto) {
        Message msg = new Message();
        msg.senderId = dto.senderId;
        msg.receiverId = dto.receiverId;
        msg.content = dto.content;
        
        messageRepository.persist(msg);
        
        return new MessageDTO(msg.id, msg.senderId, msg.receiverId, msg.content, msg.createdAt);
    }

    public List<MessageDTO> getConversation(Integer user1, Integer user2) {
        return messageRepository.findConversation(user1, user2).stream()
            .map(m -> new MessageDTO(m.id, m.senderId, m.receiverId, m.content, m.createdAt))
            .collect(Collectors.toList());
    }

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
}