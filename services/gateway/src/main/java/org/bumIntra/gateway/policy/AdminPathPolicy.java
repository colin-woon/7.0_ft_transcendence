// package org.bumIntra.gateway.policy;
//
// import org.bumIntra.gateway.exception.GatewayErrorCode;
// import org.bumIntra.gateway.exception.GatewayException;
// import org.bumIntra.gateway.security.AuthLevel;
// import org.bumIntra.gateway.security.GatewayRequestContext;
//
// import jakarta.enterprise.context.ApplicationScoped;
// import jakarta.ws.rs.container.ContainerRequestContext;
// import jakarta.ws.rs.core.Response;
//
// @ApplicationScoped
// public class AdminPathPolicy implements GatewayPolicy {
//
// @Override
// public int order() {
// return 121;
// }
//
// @Override
// public void evaluate(GatewayRequestContext grc, ContainerRequestContext
// request) {
//
// if (grc.isPublic()) {
// return;
// }
//
// // TODO: look into more unique admin identifiers
// if (grc.getPath().contains("/admin/") &&
// grc.getAuthLevel().ordinal() < AuthLevel.ADMIN.ordinal()) {
// throw new GatewayException(
// Response.Status.FORBIDDEN,
// GatewayErrorCode.FORBIDDEN,
// "Insufficient permissions");
// }
// }
// }
