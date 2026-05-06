package org.acme.service;

import org.jboss.logging.Logger;

import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserSyncAugmentor implements SecurityIdentityAugmentor {

	private static final Logger LOG = Logger.getLogger(UserSyncAugmentor.class);

	@Override
	public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
		if (identity.isAnonymous()) {
			LOG.debug("Identity is anonymous, skipping augmentation");
			return Uni.createFrom().item(identity);
		}

		return Uni.createFrom().item(identity);
	}
}
