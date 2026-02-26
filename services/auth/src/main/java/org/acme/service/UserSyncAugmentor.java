package org.acme.service;

import org.acme.model.User;
import org.jboss.logging.Logger;

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

	private static final Logger LOG = Logger.getLogger(UserSyncAugmentor.class);

	@Inject
	UserService userService;

	@Override
	public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
		// 'identity' contains the Google/42 info
		// 'context' allows us to run slow DB code safely

		if (identity.isAnonymous()) {
			LOG.debug("Identity is anonymous, skipping augmentation");
			return Uni.createFrom().item(identity);
		}

		return context.runBlocking(() -> {
			LOG.debug("Augmenting identity for: " + identity.getPrincipal().getName());

			UserInfo info = identity.getAttribute("userinfo");
			String tenantId = identity.getAttribute(OidcUtils.TENANT_ID_ATTRIBUTE);

			if (info == null || tenantId == null) {
				if (info == null)
					LOG.warn("UserInfo is null in identity augmentor");
				if (tenantId == null)
					LOG.warn("TenantId is null in identity augmentor");
				return identity;
			}

			User user = userService.syncUser(info, tenantId);
			if (user == null) {
				LOG.error("Invalid provider: " + tenantId);
				throw new WebApplicationException("Invalid provider", 401);
			}

			LOG.info("User synced successfully: " + user.email);
			return QuarkusSecurityIdentity.builder(identity)
					.addAttribute("user", user)
					.addRole(user.role.name())
					.build();
		});
	}
}
