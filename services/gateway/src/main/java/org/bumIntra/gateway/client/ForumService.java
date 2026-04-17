package org.bumIntra.gateway.client;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class ForumService {

    @Inject
    @RestClient
    ForumClient forumClient;

    @Inject
    FaultToleranceServiceCallExecutor ex;

    @Inject
    ServiceCallExecutor sce;

    public Response proxyGet(String path) {
        return ex.forumExecute(() -> forumClient.proxyGet(path));
    }

    public Response proxyPost(String path, byte[] body) {
        return sce.execute(() -> forumClient.proxyPost(path, body));
    }

    public Response proxyDelete(String path) {
        return sce.execute(() -> forumClient.proxyDelete(path));
    }

    public Response proxyPut(String path, byte[] body) {
        return sce.execute(() -> forumClient.proxyPut(path, body));
    }

    public Response proxyPatch(String path, byte[] body) {
        return sce.execute(() -> forumClient.proxyPatch(path, body));
    }
}
