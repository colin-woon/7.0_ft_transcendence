package org.bumIntra.gateway.obs;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class GatewayObserverLogging implements GatewayObserver {

	private static final Logger LOG = Logger.getLogger(GatewayObserverLogging.class);

	@Override
	public void onRequestStart(GatewayRequestStart e) {
		LOG.infov(
				"gw.start requestId={0} method={1} path={2} at={3}",
				e.requestId(),
				e.method(),
				e.path(),
				e.at());
	}

	@Override
	public void onRequestEnd(GatewayRequestEnd e) {
		LOG.infov(
				"gw.end requestId={0} httpStatus={1} latency={2} success={3} errorCode={4}",
				e.requestId(),
				e.httpStatus(),
				e.latency().toMillis(),
				e.success(),
				e.errorCode().orElse("-"));
	}
}
