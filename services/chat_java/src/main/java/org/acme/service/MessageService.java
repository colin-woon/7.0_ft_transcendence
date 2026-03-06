package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.acme.repository.MessageRepository;
import org.acme.dto.MessageDTO;
import org.acme.model.Message;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class MessageService
{
    @Inject
    MessageRepository messageRepository;

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
}

