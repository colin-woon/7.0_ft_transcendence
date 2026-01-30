package org.bumIntra.gateway.test;

import org.bumIntra.gateway.obs.GatewayObserver;
import org.bumIntra.gateway.obs.GatewayRequestStart;
import org.bumIntra.gateway.obs.GatewayRequestEnd;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@ApplicationScoped
public class TestObserverCounts implements GatewayObserver {

	private final ConcurrentHashMap<String, AtomicInteger> starts = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, AtomicInteger> ends = new ConcurrentHashMap<>();

	@Override
	public void onRequestStart(GatewayRequestStart e) {
		starts.computeIfAbsent(e.requestId(), k -> new AtomicInteger()).incrementAndGet();
	}

	@Override
	public void onRequestEnd(GatewayRequestEnd e) {
		ends.computeIfAbsent(e.requestId(), k -> new AtomicInteger()).incrementAndGet();
	}

	public int starts(String requestId) {
		var v = starts.get(requestId);
		return v == null ? 0 : v.get();
	}

	public int ends(String requestId) {
		var v = ends.get(requestId);
		return v == null ? 0 : v.get();
	}
}
