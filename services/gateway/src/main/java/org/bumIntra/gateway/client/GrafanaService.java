package org.bumIntra.gateway.client;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class GrafanaService {

    @Inject
    @RestClient
    GrafanaClient grafanaClient;

    @Inject
    ServiceCallExecutor sce;

    public Response proxyGet(String path) {
        return sce.execute(() -> grafanaClient.proxyGet(path));
    }

    public Response proxyPost(String path, byte[] body) {
        return sce.execute(() -> grafanaClient.proxyPost(path, body));
    }

    public Response proxyDelete(String path) {
        return sce.execute(() -> grafanaClient.proxyDelete(path));
    }

    public Response proxyPut(String path, byte[] body) {
        return sce.execute(() -> grafanaClient.proxyPut(path, body));
    }

    public Response proxyPatch(String path, byte[] body) {
        return sce.execute(() -> grafanaClient.proxyPatch(path, body));
    }

}
