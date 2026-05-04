package org.bumIntra.gateway.api;

import org.bumIntra.gateway.client.GrafanaService;
import org.bumIntra.gateway.client.PrometheusService;

import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/api/admin")
public class AdminResources {

    @Inject
    PrometheusService prometheusService;

    @Inject
    GrafanaService grafanaService;

    @GET
    @Path("/{service}")
    public Response proxyGet(@PathParam("service") String service) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyGet(buildObsPath(service, ""));
            case "grafana" -> grafanaService.proxyGet(buildObsPath(service, ""));
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    @GET
    @Path("/{service}/{subpath: .*}")
    public Response proxyGet(@PathParam("service") String service, @PathParam("subpath") String subpath) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyGet(buildObsPath(service, subpath));
            case "grafana" -> grafanaService.proxyGet(buildObsPath(service, subpath));
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    @POST
    @Path("/{service}/{subpath: .*}")
    public Response proxyPost(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyPost(buildObsPath(service, subpath),
                    body);
            case "grafana" -> grafanaService.proxyPost(buildObsPath(service, subpath),
                    body);
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    @DELETE
    @Path("/{service}/{subpath: .*}")
    public Response proxyDelete(@PathParam("service") String service, @PathParam("subpath") String subpath) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyDelete(buildObsPath(service, subpath));
            case "grafana" -> grafanaService.proxyDelete(buildObsPath(service, subpath));
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    @PUT
    @Path("/{service}/{subpath: .*}")
    public Response proxyPut(@PathParam("service") String service, @PathParam("subpath") String subpath, byte[] body) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyPut(buildObsPath(service, subpath),
                    body);
            case "grafana" -> grafanaService.proxyPut(buildObsPath(service, subpath),
                    body);
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    @PATCH
    @Path("/{service}/{subpath: .*}")
    public Response proxyPatch(@PathParam("service") String service, @PathParam("subpath") String subpath,
            byte[] body) {
        return switch (service) {
            case "prometheus" -> prometheusService.proxyPatch(buildObsPath(service, subpath),
                    body);
            case "grafana" -> grafanaService.proxyPatch(buildObsPath(service, subpath),
                    body);
            default -> Response.status(Response.Status.NOT_FOUND).entity("Service not found").build();
        };
    }

    private String buildObsPath(String service, String subpath) {
        String prefix = switch (service) {
            case "prometheus" -> "api/admin/prometheus";
            case "grafana" -> "api/admin/grafana";
            default -> "";
        };

        if (prefix.isEmpty()) {
            return subpath;
        }

        if (subpath == null || subpath.isBlank()) {
            return prefix + "/";
        }

        return prefix + "/" + subpath;
    }

}
