package org.acme.service;

import io.quarkus.oidc.TenantResolver;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CustomTenantResolver implements TenantResolver {

	@Override
	public String resolve(RoutingContext context) {
		String path = context.request().path();
		System.out.println("Resolving tenant for path: " + path);

		if (path.startsWith("/auth/login/google")) {
			System.out.println("Tenant resolved: google");
			return "google";
		}
		else if (path.startsWith("/auth/login/42")) {
			System.out.println("Tenant resolved: 42");
			return "42";
		}

		// io.vertx.core.http.Cookie tenantCookie = context.request().getCookie("q_tenant");
    	// if (tenantCookie != null) {
    	    // return tenantCookie.getValue();
    	// }
		
		return null; // Uses the 'default' tenant if no provider is found
	}
}
