package org.bumIntra.gateway.client;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class PrometheusService {

    @Inject
    @RestClient
    PrometheusClient prometheusClient;

    @Inject
    ServiceCallExecutor sce;

    public Response proxyGet(String path) {
        return sce.execute(() -> prometheusClient.proxyGet(path));
    }

    public Response proxyPost(String path, byte[] body) {
        return sce.execute(() -> prometheusClient.proxyPost(path, body));
    }

    public Response proxyDelete(String path) {
        return sce.execute(() -> prometheusClient.proxyDelete(path));
    }

    public Response proxyPut(String path, byte[] body) {
        return sce.execute(() -> prometheusClient.proxyPut(path, body));
    }

    public Response proxyPatch(String path, byte[] body) {
        return sce.execute(() -> prometheusClient.proxyPatch(path, body));
    }
}
