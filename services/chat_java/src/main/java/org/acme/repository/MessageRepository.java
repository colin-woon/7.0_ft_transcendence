package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.model.Message;
import java.util.List;

@ApplicationScoped
public class MessageRepository implements PanacheRepository<Message> {

    //find conversation between two users
    public List<Message> findConversation(Integer user1, Integer user2) {
        return find("(senderId = ?1 and receiverId = ?2) or (senderId = ?2 and receiverId = ?1) order by createdAt", 
               user1, user2).list();
    }
}