package org.bumIntra.gateway.obs;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.bumIntra.gateway.obs.event.*;

@ApplicationScoped
public class GatewayObserverMetrics implements GatewayObserver {

    private final MeterRegistry _meterRegistry;

    // --- HTTP Request Metrics ---
    private final Map<ReqKey, Counter> _requestCounters = new ConcurrentHashMap<>();
    private final Map<ReqErrorKey, Counter> _requestErrorCounters = new ConcurrentHashMap<>();
    private final Map<ReqTimerKey, Timer> _requestTimerCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> _requestTimeoutCounters = new ConcurrentHashMap<>();

    // --- WebSocket Metrics ---
    private final Counter _wsOpenTotal;
    private final Counter _wsCloseTotal;
    private final Map<String, Counter> _wsAuthResultCounters = new ConcurrentHashMap<>();
    private final AtomicInteger _activeWsSessions = new AtomicInteger(0);
    private final Map<GatewayWsThrottle.WsThrottleType, Counter> _wsThrottleCounters;
    private final Map<String, Counter> _wsCloseCodesCounters = new ConcurrentHashMap<>();
    private final Timer _wsAuthTimer;
    private final Counter _wsErrorTotal;
    private final Map<String, Counter> _wsBridgeFailureCounters = new ConcurrentHashMap<>();

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

    private record ReqKey(
            String result, String errorCode, String downstream, String service, String path) {
    }

    private record ReqTimerKey(String result, String downstream, String service, String path) {
    }

    private record ReqErrorKey(String errorCode, String service, String path) {
    }

    @Inject
    public GatewayObserverMetrics(MeterRegistry meterRegistry,
            org.bumIntra.gateway.websocket.grafana.GrafanaWsRegistry grafanaRegistry) {
        _meterRegistry = meterRegistry;

        // --- WebSocket Metrics Registration ---
        _wsOpenTotal = Counter.builder("gateway_ws_sessions_open_total")
                .tag("action", "open")
                .description("Total WebSocket sessions opened")
                .register(meterRegistry);

        _wsCloseTotal = Counter.builder("gateway_ws_sessions_close_total")
                .tag("action", "close")
                .description("Total WebSocket sessions closed")
                .register(meterRegistry);

        _wsAuthResultCounters.put("success", Counter.builder("gateway_ws_auth_total")
                .description("Total WebSocket authentication attempts by result")
                .tag("result", "success")
                .register(meterRegistry));

        _wsAuthResultCounters.put("failure", Counter.builder("gateway_ws_auth_total")
                .description("Total WebSocket authentication attempts by result")
                .tag("result", "failure")
                .register(meterRegistry));

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

        _wsErrorTotal = Counter.builder("gateway_ws_errors_total")
                .description("Total WebSocket errors")
                .register(meterRegistry);

        // --- Bridge Metrics ---
        Gauge.builder("gateway_ws_active_bridges", grafanaRegistry, r -> r.getRegistrySize())
                .description("Current number of active WebSocket bridges to internal services")
                .tag("service", "grafana")
                .register(meterRegistry);

    }

    @Override
    public void onRequestEnd(GatewayRequestEnd gre) {

        String result = gre.success() ? "success" : "failure";
        String errorCode = gre.errorCode().orElse("NONE");
        String downstream = gre.latency().isZero() ? "cb_fast_fail" : "called";
        String serviceName = gre.serviceName().orElse("unknown");
        String pathType = gre.pathType().orElse("unknown");

        ReqKey key = new ReqKey(result, errorCode, downstream, serviceName, pathType);
        ReqTimerKey timerKey = new ReqTimerKey(result, downstream, serviceName, pathType);
        ReqErrorKey errorKey = new ReqErrorKey(errorCode, serviceName, pathType);

        // ----- Record request count -----
        _requestCounters
                .computeIfAbsent(
                        key,
                        k -> Counter.builder("gateway_http_requests_total")
                                .description("Total HTTP requests processed by the gateway")
                                .tag("result", k.result())
                                .tag("error_code", k.errorCode())
                                .tag("downstream", k.downstream())
                                .tag("service", k.service())
                                .tag("path", k.path())
                                .register(_meterRegistry))
                .increment();

        // ----- Record Error count -----
        if (!gre.success()) {
            _requestErrorCounters
                    .computeIfAbsent(
                            errorKey,
                            k -> Counter.builder("gateway_http_errors_total")
                                    .description("Total HTTP request errors by error code")
                                    .tag("error_code", k.errorCode())
                                    .tag("service", k.service())
                                    .tag("path", k.path())
                                    .register(_meterRegistry))
                    .increment();
        }

        // ----- Record latency -----
        _requestTimerCounters
                .computeIfAbsent(
                        timerKey,
                        k -> Timer.builder("gateway_http_request_duration_seconds")
                                .description("HTTP request latency in seconds")
                                .tag("result", k.result())
                                .tag("service", k.service())
                                .tag("downstream", k.downstream())
                                .tag("path", k.path())
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
                                .register(_meterRegistry))
                .record(gre.latency());

        // ----- Record Timeouts -----
        if ("SERVICE_TIMEOUT".equals(errorCode)) {
            _requestTimeoutCounters
                    .computeIfAbsent(
                            serviceName,
                            k -> Counter.builder("gateway_downstream_timeouts_total")
                                    .description("Total downstream timeouts by service")
                                    .tag("service", k)
                                    .register(_meterRegistry))
                    .increment();
        }
    }

    // ----- WebSocket Events -----
    @Override
    public void onWsOpen(GatewayWsOpen e) {
        _wsOpenTotal.increment();
        _activeWsSessions.incrementAndGet();
    }

    @Override
    public void onWsClose(GatewayWsClose e) {
        _wsCloseTotal.increment();
        _activeWsSessions.updateAndGet(current -> Math.max(0, current - 1));

        String closeCode = String.valueOf(e.closeCode());
        if (COMMON_CLOSE_CODES.contains(closeCode)) {
            _wsCloseCodesCounters
                    .computeIfAbsent(closeCode, k -> Counter.builder("gateway_ws_sessions_close_by_code_total")
                            .description("Total WebSocket close events by code")
                            .tag("close_code", k)
                            .register(_meterRegistry))
                    .increment();
        } else {
            _wsCloseCodesCounters
                    .computeIfAbsent("other", k -> Counter.builder("gateway_ws_sessions_close_by_code_total")
                            .description("Total WebSocket close events with uncommon codes")
                            .tag("close_code", k)
                            .register(_meterRegistry))
                    .increment();
        }
    }

    @Override
    public void onWsAuth(GatewayWsAuth e) {
        String result = e.success() ? "success" : "failure";
        Counter counter = _wsAuthResultCounters.get(result);
        if (counter != null) {
            counter.increment();
        }

        e.latency().ifPresent(latency -> _wsAuthTimer.record(latency.toMillis(), TimeUnit.MILLISECONDS));
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
        _wsErrorTotal.increment();
    }

    @Override
    public void onWsBridgeFailure(String serviceName, Throwable t) {
        _wsBridgeFailureCounters
                .computeIfAbsent(serviceName, k -> Counter.builder("gateway_ws_bridge_failures_total")
                        .description("Total failures connecting to upstream WebSocket service")
                        .tag("service", k)
                        .register(_meterRegistry))
                .increment();
    }

}
