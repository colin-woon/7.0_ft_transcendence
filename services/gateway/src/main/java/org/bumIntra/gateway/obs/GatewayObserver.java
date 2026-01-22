package org.bumIntra.gateway.obs;

public interface GatewayObserver {

	default void onRequestStart(GatewayRequestStart e) {
	}

	default void onRequestEnd(GatewayRequestEnd e) {
	}
}
