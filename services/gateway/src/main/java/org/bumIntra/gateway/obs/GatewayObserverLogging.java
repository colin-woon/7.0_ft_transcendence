package org.bumIntra.gateway.obs;

import org.bumIntra.gateway.obs.event.*;

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

	@Override
	public void onWsOpen(GatewayWsOpen e) {
		LOG.infov("gw.ws.open sessionId={0} ip={1} at={2}",
				e.sessionId(), e.clientIp(), e.at());
	}

	@Override
	public void onWsAuth(GatewayWsAuth e) {
		LOG.infov("gw.ws.auth sessionId={0} ip={1} success={2} userId={3} latencyMs={4} reason={5}",
				e.sessionId(), e.clientIp(), e.success(),
				e.userId().orElse("-"),
				e.latency().toMillis(),
				e.reason().orElse("-"));
	}

	@Override
	public void onWsThrottle(GatewayWsThrottle e) {
		LOG.infov("gw.ws.throttle sessionId={0} ip={1} userId={2} type={3} key={4} at={5}",
				e.sessionId(),
				e.clientIp(),
				e.userId().orElse("-"),
				e.type(),
				e.key(),
				e.at());
	}

	@Override
	public void onWsClose(GatewayWsClose e) {
		LOG.infov("gw.ws.close sessionId={0} userId={1} code={2} reason={3} at={4}",
				e.sessionId(),
				e.userId().orElse("-"),
				e.closeCode(),
				e.reason(),
				e.at());
	}

	@Override
	public void onWsError(String sessionId, Throwable error) {
		LOG.warnf(error, "gw.ws.error sessionId=%s", sessionId);
	}
}
