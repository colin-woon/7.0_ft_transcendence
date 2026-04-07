package org.acme.service;

import org.jboss.logging.Logger;

import io.quarkus.oidc.TenantResolver;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CustomTenantResolver implements TenantResolver {

	private static final Logger LOG = Logger.getLogger(CustomTenantResolver.class);

	@Override
	public String resolve(RoutingContext context) {
		String path = context.request().path();
		LOG.debug("Resolving tenant for path: " + path);

		if (path.equals("/api/public/auth/login/google") || path.equals("/api/public/auth/callback/google")
			|| path.equals("/auth/login/google") || path.equals("/auth/callback/google")) {
			LOG.debug("Tenant resolved: google");
			return "google";
		}
		else if (path.equals("/api/public/auth/login/42") || path.equals("/api/public/auth/callback/42")
			|| path.equals("/auth/login/42") || path.equals("/auth/callback/42")) {
			LOG.debug("Tenant resolved: 42");
			return "42";
		}
		
		return null; // Uses the 'default' tenant if no provider is found
	}
}
