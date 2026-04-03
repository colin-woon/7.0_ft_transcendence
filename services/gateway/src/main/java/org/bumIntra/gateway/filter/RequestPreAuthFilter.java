package org.bumIntra.gateway.filter;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.bumIntra.gateway.config.GatewayAuthConfig;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayException;
import org.bumIntra.gateway.security.AuthLevel;
import org.bumIntra.gateway.security.GatewayRequestContext;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Provider
@Priority(Priorities.AUTHENTICATION - 70)
public class RequestPreAuthFilter implements ContainerRequestFilter {

  @Inject GatewayRequestContext grc;

  @Inject GatewayAuthConfig gac;

  @Inject SecurityIdentity si;

  @Override
  public void filter(ContainerRequestContext request) {

    if (!si.isAnonymous() && si.getPrincipal() instanceof JsonWebToken) {

      JsonWebToken jwt = (JsonWebToken) si.getPrincipal();
      grc.setUserId(jwt.getSubject());
      grc.setRoles(jwt.getGroups());

      if (jwt.getGroups().contains("ADMIN")) {
        grc.setAuthLevel(AuthLevel.ADMIN);
      } else {
        grc.setAuthLevel(AuthLevel.USER);
      }
    } else if (grc.isInternal()) {
      grc.setAuthLevel(AuthLevel.SERVICE);
    }

    boolean isPublicPath = gac.getPublicPaths().stream().anyMatch(grc.getPath()::startsWith);
    grc.setPublic(isPublicPath);

    if (grc.isInternal() || isPublicPath || !gac.required()) {
      return;
    }

    if (si.getPrincipal() == null || !(si.getPrincipal() instanceof JsonWebToken)) {
      throw new GatewayException(
          Response.Status.UNAUTHORIZED,
          GatewayErrorCode.AUTH_REQUIRED,
          "Authentication is required");
    }

    // Method Returns Source Claim
    // jwt.getSubject() String sub (The "123" ID)
    // jwt.getIssuer() String iss
    // jwt.getGroups() Set<String> groups
    // jwt.getExpirationTime() long exp
    // jwt.getClaim("upn") T (Generic) upn (The email)
  }
}
