package org.bumIntra.gateway.obs;

import org.bumIntra.gateway.obs.event.*;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.enterprise.inject.Typed;
import jakarta.inject.Inject;

@ApplicationScoped
@Typed(GatewayObserverDispatcher.class)
public class GatewayObserverDispatcher implements GatewayObserver {

	private final Instance<GatewayObserver> obs;

	@Inject
	public GatewayObserverDispatcher(Instance<GatewayObserver> obs) {
		this.obs = obs;
	}

	@Override
	public void onRequestStart(GatewayRequestStart grs) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onRequestStart(grs);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onRequestEnd(GatewayRequestEnd gre) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onRequestEnd(gre);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onWsOpen(GatewayWsOpen gwo) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onWsOpen(gwo);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onWsAuth(GatewayWsAuth gwa) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onWsAuth(gwa);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onWsThrottle(GatewayWsThrottle gwt) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onWsThrottle(gwt);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onWsClose(GatewayWsClose gwc) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onWsClose(gwc);
				} catch (Throwable ignored) {
				}
		}
	}

	@Override
	public void onWsError(String sessionId, Throwable t) {
		for (var o : obs) {
			if (o != this)
				try {
					o.onWsError(sessionId, t);
				} catch (Throwable ignored) {
				}
		}
	}
}
