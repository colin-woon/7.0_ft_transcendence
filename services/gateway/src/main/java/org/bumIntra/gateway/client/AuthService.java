package org.bumIntra.gateway.client;

import org.bumIntra.gateway.client.dto.AuthResult;
import org.bumIntra.gateway.client.FaultToleranceServiceCallExecutor;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class AuthService {

    @Inject
    @RestClient
    AuthClient authClient;

    @Inject
    FaultToleranceServiceCallExecutor ex;

    @Inject
    ServiceCallExecutor sce;

    @Inject
    FaultToleranceExceptionMapper ftm;

    public Response proxyGet(String path) {
        return ftm.execute(() -> ex.authExecute(() -> authClient.proxyGet(path)));
    }

    public Response proxyPost(String path, byte[] body) {
        return sce.execute(() -> authClient.proxyPost(path, body));
    }

    public Response proxyDelete(String path) {
        return sce.execute(() -> authClient.proxyDelete(path));
    }

    public Response proxyPut(String path, byte[] body) {
        return sce.execute(() -> authClient.proxyPut(path, body));
    }

    public Response proxyPatch(String path, byte[] body) {
        return sce.execute(() -> authClient.proxyPatch(path, body));
    }
}
