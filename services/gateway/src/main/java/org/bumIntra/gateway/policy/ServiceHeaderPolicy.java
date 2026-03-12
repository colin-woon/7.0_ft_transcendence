// package org.bumIntra.gateway.policy;
//
// import org.bumIntra.gateway.security.GatewayRequestContext;
//
// import jakarta.enterprise.context.ApplicationScoped;
// import jakarta.ws.rs.container.ContainerRequestContext;
//
// /**
// * NOTE: Header injection for downstream services is handled by
// * ServiceRequestContextFilter (ClientRequestFilter) which runs on the
// outbound
// * REST client request. Mutating ContainerRequestContext here has no effect on
// * the outbound HTTP call — server-side header mutations stay server-side.
// *
// * Use this policy only for server-side pre-routing logic (e.g. enrichment
// that
// * other server-side filters need to read before the resource method runs).
// */
// @ApplicationScoped
// public class ServiceHeaderPolicy implements GatewayPolicy {
//
// @Override
// public int order() {
// return 200;
// }
//
// @Override
// public void evaluate(GatewayRequestContext grc, ContainerRequestContext
// request) {
// // Header injection to downstream is done via ServiceRequestContextFilter.
// // Add any server-side request enrichment logic here if needed.
// }
// }
