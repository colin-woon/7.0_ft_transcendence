package org.bumIntra.gateway.api;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import org.bumIntra.gateway.client.StreamChatService;
import org.bumIntra.gateway.obs.GatewayObserverDispatcher;
import org.bumIntra.gateway.obs.event.GatewayRequestEnd;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;

@Path("/api/stream")
@Produces(MediaType.SERVER_SENT_EVENTS)
public class StreamResources {

    private static final Logger LOG = Logger.getLogger(StreamResources.class);

    @Inject
    GatewayRequestContext grc;

    @Inject
    GatewayObserverDispatcher obs;

    @Inject
    StreamChatService chat;

    @GET
    @Path("/{service}/{subpath: .*}")
    public Response proxyStream(@PathParam("service") String service, @PathParam("subpath") String subpath) {
        return switch (service) {
            // case "auth" -> authService.proxyStream(buildPath(service, subpath));
            // case "forum" -> forumService.proxyStream(buildPath(service, subpath));
            case "chat" -> buildStream(chat.proxyStream(buildPath(service, subpath)));
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    private Response buildStream(Response upstream) {
        int status = upstream.getStatus();

        if (status == 401 || status == 403 || status == 404) {
            upstream.close();
            emitRequestEnd(status, false);
            return Response.status(status).build();
        }

        if (upstream.getStatusInfo().getFamily() != Response.Status.Family.SUCCESSFUL) {
            upstream.close();
            emitRequestEnd(Response.Status.BAD_GATEWAY.getStatusCode(), false);
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity("Failed to connect to upstream service")
                    .build();
        }

        AtomicBoolean streamError = new AtomicBoolean(false);

        StreamingOutput stream = output -> {
            try (upstream; InputStream is = upstream.readEntity(InputStream.class)) {
                byte[] buffer = new byte[8192];
                int bytesRead;

                while ((bytesRead = is.read(buffer)) != -1) {
                    output.write(buffer, 0, bytesRead);
                    output.flush();
                }
            } catch (IOException e) {
                LOG.debugf("SSE stream closed or interrupted: requestId=%s, message=%s",
                        grc.getRequestId(), e.getMessage());
            } catch (Exception e) {
                streamError.set(true);
                LOG.errorf(e, "Unexpected SSE streaming failure: requestId=%s", grc.getRequestId());
            } finally {
                emitRequestEnd(status, !streamError.get());

                MDC.clear();
            }
        };

        return Response.ok(stream)
                .type(MediaType.SERVER_SENT_EVENTS)
                .header("Cache-Control", "no-cache")
                .build();
    }

    private String buildPath(String service, String subpath) {
        if (service.equals("auth")) {
            return service + "/" + subpath;
        }
        return subpath;
    }

    private void emitRequestEnd(int status, boolean success) {
        obs.onRequestEnd(new GatewayRequestEnd(
                grc.getRequestId(),
                status,
                Duration.between(grc.getStartTime(), Instant.now()),
                success,
                Optional.ofNullable(grc.getErrorCode()),
                Optional.ofNullable(grc.getServiceName()),
                Optional.ofNullable(grc.getPathType())));
    }
}
