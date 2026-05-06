package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.StreamChatService;
import org.bumIntra.gateway.stream.SseProxyService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/stream")
@Produces(MediaType.SERVER_SENT_EVENTS)
public class StreamResources {

    @Inject
    StreamChatService chat;

    @Inject
    SseProxyService sseProxy;

    @GET
    @Path("/{service}/{subpath: .*}")
    public Response proxyStream(@PathParam("service") String service, @PathParam("subpath") String subpath) {
        return switch (service) {
            case "chat" -> sseProxy.buildStream(chat.proxyStream(buildPath(service, subpath)));
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    private String buildPath(String service, String subpath) {
        if (service.equals("auth")) {
            return service + "/" + subpath;
        }
        return subpath;
    }
}
