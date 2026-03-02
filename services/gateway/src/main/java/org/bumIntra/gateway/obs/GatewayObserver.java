package org.bumIntra.gateway.obs;

import org.bumIntra.gateway.obs.event.*;

public interface GatewayObserver {

	default void onRequestStart(GatewayRequestStart e) {
	}

	default void onRequestEnd(GatewayRequestEnd e) {
	}

	default void onWsOpen(GatewayWsOpen e) {
	}

	default void onWsAuth(GatewayWsAuth e) {
	}

	default void onWsThrottle(GatewayWsThrottle e) {
	}

	default void onWsClose(GatewayWsClose e) {
	}

	default void onWsError(String sessionId, Throwable t) {
	}
}
