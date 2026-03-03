package org.bumIntra.gateway.obs;

import org.bumIntra.gateway.obs.event.*;

import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GatewayObserverMetrics implements GatewayObserver {

	private final MeterRegistry _meterRegistry;

	private final Counter _wsOpenTotal;
	private final Counter _wsCloseTotal;
	private final Counter _wsAuthSuccessTotal;
	private final Counter _wsAuthFailureTotal;
	private final AtomicInteger _activeWsSessions = new AtomicInteger(0);
	private final Map<GatewayWsThrottle.WsThrottleType, Counter> _wsThrottleCounters;
	private final Map<String, Counter> _wsCloseCodesCounters;
	private final Timer _wsAuthTimer;
	private static final Set<String> COMMON_CLOSE_CODES = Set.of(
			"1000", // Normal Closure
			"1001", // Going Away
			"1002", // Protocol Error
			"1003", // Unsupported Data
			"1006", // Abnormal Closure (no close frame)
			"1007", // Invalid frame payload data
			"1008", // Policy Violation
			"1009", // Message Too Big
			"1011", // Internal Server Error
			"1012", // Service Restart
			"1013", // Try Again Later
			"1014", // Bad Gateway
			"1015" // TLS Handshake Failure
	);

	@Inject
	public GatewayObserverMetrics(MeterRegistry meterRegistry) {
		_meterRegistry = meterRegistry;

		// --- WebSocket Metrics Registration ---
		_wsOpenTotal = Counter.builder("gateway_ws_open_total")
				.tag("action", "open")
				.description("Total WebSocket sessions opened")
				.register(meterRegistry);

		_wsCloseTotal = Counter.builder("gateway_ws_close_total")
				.tag("action", "close")
				.description("Total WebSocket sessions closed")
				.register(meterRegistry);

		_wsAuthSuccessTotal = Counter.builder("gateway_ws_auth_success_total")
				.tag("result", "success")
				.register(meterRegistry);

		_wsAuthFailureTotal = Counter.builder("gateway_ws_auth_failure_total")
				.tag("result", "failure")
				.register(meterRegistry);

		_wsAuthTimer = Timer.builder("gateway_ws_auth_duration_seconds")
				.description("WebSocket authentication latency in seconds")
				.publishPercentileHistogram()
				.serviceLevelObjectives(
						Duration.ofMillis(10),
						Duration.ofMillis(25),
						Duration.ofMillis(50),
						Duration.ofMillis(100),
						Duration.ofMillis(200),
						Duration.ofMillis(350),
						Duration.ofMillis(500),
						Duration.ofMillis(750),
						Duration.ofSeconds(1),
						Duration.ofMillis(1500),
						Duration.ofMillis(2500),
						Duration.ofSeconds(5))
				.register(meterRegistry);

		// Register the Gauge to track current online users
		Gauge.builder("gateway_ws_active_sessions", _activeWsSessions, AtomicInteger::get)
				.description("Current number of active WebSocket connections")
				.register(meterRegistry);

		// Initialize throttle counters for each type
		_wsThrottleCounters = new EnumMap<>(GatewayWsThrottle.WsThrottleType.class);
		for (GatewayWsThrottle.WsThrottleType type : GatewayWsThrottle.WsThrottleType.values()) {
			_wsThrottleCounters.put(type, Counter.builder("gateway_ws_throttle_total")
					.description("Total WebSocket throttling events")
					.tag("type", type.name())
					.register(meterRegistry));
		}

		// Initialize close code counters for common close codes
		_wsCloseCodesCounters = new java.util.HashMap<>();
		for (String code : COMMON_CLOSE_CODES) {
			_wsCloseCodesCounters.put(code, Counter.builder("gateway_ws_close_total")
					.description("Total WebSocket close events by code")
					.tag("close_code", code)
					.register(meterRegistry));
		}

		_wsCloseCodesCounters.put("other", Counter.builder("gateway_ws_close_total")
				.description("Total WebSocket close events with uncommon codes")
				.tag("close_code", "other")
				.register(meterRegistry));
	}

	// TODO: move counter and builder into constructor
	@Override
	public void onRequestEnd(GatewayRequestEnd gre) {

		String result = gre.success() ? "success" : "failure";
		String errorCode = gre.errorCode().orElse("NONE");
		String downstream = gre.latency().isZero() ? "cb_fast_fail" : "called";

		// ----- Record request count -----
		Counter.builder("gateway_requests_total")
				.description("Total gateway requests")
				.tag("result", result)
				.tag("error_code", errorCode)
				.register(_meterRegistry)
				.increment();

		// ----- Record Error count -----
		if (!gre.success()) {
			Counter.builder("gateway_errors_total")
					.description("Gateway errors by code")
					.tag("error_code", errorCode)
					.register(_meterRegistry)
					.increment();
		}

		// ----- Record latency -----
		Timer.builder("gateway_request_duration_seconds")
				.description("Gateway request latency in seconds")
				.tag("result", result)
				.tag("downstream", downstream)
				.publishPercentileHistogram()
				.serviceLevelObjectives(
						Duration.ofMillis(10),
						Duration.ofMillis(25),
						Duration.ofMillis(50),
						Duration.ofMillis(100),
						Duration.ofMillis(200),
						Duration.ofMillis(350),
						Duration.ofMillis(500),
						Duration.ofMillis(750),
						Duration.ofSeconds(1),
						Duration.ofMillis(1500),
						Duration.ofMillis(2500),
						Duration.ofSeconds(5))
				.register(_meterRegistry)
				.record(gre.latency());

		// ----- Record Timeouts -----
		if ("SERVICE_TIMEOUT".equals(errorCode)) {
			Counter.builder("gateway_timeouts_total")
					.description("Total services timeouts")
					.tag("service", "auth-service") // TODO: Make dynamic when more services are added
					.register(_meterRegistry)
					.increment();
		}
	}

	@Override
	public void onWsOpen(GatewayWsOpen e) {
		_wsOpenTotal.increment();
		_activeWsSessions.incrementAndGet();
	}

	@Override
	public void onWsClose(GatewayWsClose e) {
		_wsCloseTotal.increment();
		_activeWsSessions.decrementAndGet();

		String closeCode = String.valueOf(e.closeCode());
		Counter byCode = _wsCloseCodesCounters.get(COMMON_CLOSE_CODES.contains(closeCode) ? closeCode : "other");
		byCode.increment();
	}

	@Override
	public void onWsAuth(GatewayWsAuth e) {
		if (e.success()) {
			_wsAuthSuccessTotal.increment();
		} else {
			_wsAuthFailureTotal.increment();
		}

		_wsAuthTimer.record(e.latency());

		// Record authentication latency
		// Timer.builder("gateway_ws_auth_duration_seconds")
		// .description("WebSocket authentication latency in seconds")
		// .tag("result", e.success() ? "success" : "failure")
		// .publishPercentileHistogram()
		// .serviceLevelObjectives(
		// Duration.ofMillis(10),
		// Duration.ofMillis(25),
		// Duration.ofMillis(50),
		// Duration.ofMillis(100),
		// Duration.ofMillis(200),
		// Duration.ofMillis(350),
		// Duration.ofMillis(500),
		// Duration.ofMillis(750),
		// Duration.ofSeconds(1),
		// Duration.ofMillis(1500),
		// Duration.ofMillis(2500),
		// Duration.ofSeconds(5))
		// .register(_meterRegistry)
		// .record(e.latency());
	}

	@Override
	public void onWsThrottle(GatewayWsThrottle e) {
		Counter counter = _wsThrottleCounters.get(e.type());
		if (counter != null) {
			counter.increment();
		}
	}

	@Override
	public void onWsError(String sessionId, Throwable t) {
		Counter.builder("gateway_ws_errors_total")
				.description("Total WebSocket errors")
				.register(_meterRegistry)
				.increment();
	}
}
