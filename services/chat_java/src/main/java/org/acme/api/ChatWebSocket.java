package org.acme.api;

import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.OnTextMessage;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.PathParam;
import io.quarkus.websockets.next.WebSocket;
import jakarta.inject.Inject;

import org.acme.repository.MessageRepository;


@WebSocket(path = "/chat/{senderUserId}")
public class ChatWebSocket {

    @Inject
    OpenConnections connections;

    @Inject
    MessageRepository repository;

    @OnOpen
    public void onOpen()
    {
        System.out.println("New WebSocket connection established");
    }

    // @OnTextMessage
    // public void onMessage(@PathParam("senderUserId") String senderUserId, MessageDTO messagePayload){
    //     connections.stream().forEach(connection -> {
    //         if (connection.pathParam("senderUserId").equals(messagePayload.receiverId))
    //         {
    //             connection.sendText(messagePayload.content);
    //         }
    //     });
    // }

}
