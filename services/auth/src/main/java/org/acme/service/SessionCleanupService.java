package org.acme.service;

import java.time.Instant;

import org.acme.repository.SessionRepository;
import org.jboss.logging.Logger;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SessionCleanupService {

	private static final Logger LOG = Logger.getLogger(SessionCleanupService.class);

	@Inject
	SessionRepository sessionRepository;

	/**
	 * Cleanup expired sessions every hour
	 * Cron expression: 0 0 * * * ? (every hour at minute 0)
	 */
	@Scheduled(cron = "0 0 * * * ?")
	@Transactional
	public void cleanupExpiredSessions() {
		LOG.info("Starting scheduled session cleanup");
		
		long deletedCount = sessionRepository.delete("expiresAt < ?1", Instant.now());
		
		if (deletedCount > 0) {
			LOG.info("Cleaned up " + deletedCount + " expired sessions");
		} else {
			LOG.debug("No expired sessions to clean up");
		}
	}

	/**
	 * Manual cleanup method that can be called programmatically
	 * @return number of sessions deleted
	 */
	@Transactional
	public long manualCleanup() {
		LOG.info("Manual session cleanup triggered");
		long deletedCount = sessionRepository.delete("expiresAt < ?1", Instant.now());
		LOG.info("Manually cleaned up " + deletedCount + " expired sessions");
		return deletedCount;
	}
}
