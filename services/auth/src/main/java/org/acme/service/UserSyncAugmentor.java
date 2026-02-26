package org.acme.service;

import org.acme.model.User;

import io.quarkus.oidc.UserInfo;
import io.quarkus.oidc.runtime.OidcUtils;
import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class UserSyncAugmentor implements SecurityIdentityAugmentor {

	@Inject
	UserService userService;

	@Override
	public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
		// 'identity' contains the Google/42 info
		// 'context' allows us to run slow DB code safely

		if (identity.isAnonymous()) {
			System.out.println("Identity is anonymous, skipping augmentation");
			return Uni.createFrom().item(identity);
		}

		return context.runBlocking(() -> {
			System.out.println("Hit the UserSyncAugmentor");
			System.out.println("Identity principal: " + identity.getPrincipal().getName());
            System.out.println("Identity attributes: " + identity.getAttributes().keySet());

			UserInfo info = identity.getAttribute("userinfo");
			String tenantId = identity.getAttribute(OidcUtils.TENANT_ID_ATTRIBUTE);

			if (info == null || tenantId == null) {
				if (info == null)
					System.out.println("UserInfo is null in identity augmentor");
				if (tenantId == null)
					System.out.println("TenantId is null in identity augmentor");
				return identity;
			}

			User user = userService.syncUser(info, tenantId);
			if (user == null)
				throw new WebApplicationException("Invalid provider", 401);

			return QuarkusSecurityIdentity.builder(identity)
					.addAttribute("user", user)
					.addRole(user.role.name())
					.build();
		});
	}
}
