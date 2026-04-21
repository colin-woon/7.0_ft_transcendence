package org.bumIntra.gateway.obs;

import org.bumIntra.gateway.obs.event.*;

public interface GatewayObserver {

    default void onRequestStart(GatewayRequestStart e) {
    }

    default void onRequestEnd(GatewayRequestEnd e) {
    }
}
