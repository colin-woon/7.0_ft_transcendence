package org.bumIntra.gateway.client;

import org.bumIntra.gateway.filter.ServiceClientContextFilter;
import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/")
@RegisterRestClient(configKey = "prometheus-service")
@RegisterProvider(ServiceClientContextFilter.class)
public interface PrometheusClient {

    @GET
    @Path("/{path: .*}")
    Response proxyGet(@Encoded @PathParam("path") String path);

    @POST
    @Path("/{path: .*}")
    Response proxyPost(@Encoded @PathParam("path") String path, byte[] body);

    @DELETE
    @Path("/{path: .*}")
    Response proxyDelete(@Encoded @PathParam("path") String path);

    @PUT
    @Path("/{path: .*}")
    Response proxyPut(@Encoded @PathParam("path") String path, byte[] body);

    @PATCH
    @Path("/{path: .*}")
    Response proxyPatch(@Encoded @PathParam("path") String path, byte[] body);
}
