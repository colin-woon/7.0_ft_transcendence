package org.acme.api;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.acme.dto.MessageDTO;
import org.acme.service.ChatService;
import java.util.List;

@Path("/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChatResource {

    @Inject
    ChatService chatService;

	//send message
    @POST
    @Path("/messages")
    public MessageDTO sendMessage(MessageDTO msg) {
        return chatService.sendMessage(msg);
    }

	//getting conversation history between 2 users
    @GET
    @Path("/history/{user1}/{user2}")
    public List<MessageDTO> getHistory(@PathParam("user1") Integer user1, @PathParam("user2") Integer user2) {
        return chatService.getConversation(user1, user2);
    }

	//sending friend request
	@POST
    @Path("/friends/{requesterId}/{addresseeId}")
    public Response addFriend(@PathParam("requesterId") Integer reqId, 
                              @PathParam("addresseeId") Integer addrId) {
        chatService.sendFriendRequest(reqId, addrId);
        return Response.status(201).build();
    }

    @PATCH
    @Path("/friends/{requesterId}/{addresseeId}/accept")
    public Response acceptFriendRequest(@PathParam("requesterId") Integer reqId,
                                        @PathParam("addresseeId") Integer addrId) {
        chatService.acceptFriendRequest(reqId, addrId);
        return Response.ok().build();
    }
}