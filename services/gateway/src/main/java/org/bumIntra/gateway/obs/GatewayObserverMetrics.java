package org.bumIntra.gateway.obs;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.bumIntra.gateway.obs.event.*;

@ApplicationScoped
public class GatewayObserverMetrics implements GatewayObserver {

  private final MeterRegistry _meterRegistry;

  // --- HTTP Request Metrics ---
  private final Map<ReqKey, Counter> _requestCounters = new ConcurrentHashMap<>();
  private final Map<ReqErrorKey, Counter> _requestErrorCounters = new ConcurrentHashMap<>();
  private final Map<ReqTimerKey, Timer> _requestTimerCounters = new ConcurrentHashMap<>();
  private final Map<String, Counter> _requestTimeoutCounters = new ConcurrentHashMap<>();

  private record ReqKey(
      String result, String errorCode, String downstream, String service, String path) {}

  private record ReqTimerKey(String result, String downstream, String service, String path) {}

  private record ReqErrorKey(String errorCode, String service, String path) {}

  @Inject
  public GatewayObserverMetrics(MeterRegistry meterRegistry) {
    _meterRegistry = meterRegistry;
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
            k ->
                Counter.builder("gateway_http_requests_total")
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
              k ->
                  Counter.builder("gateway_http_errors_total")
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
            k ->
                Timer.builder("gateway_http_request_duration_seconds")
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
              k ->
                  Counter.builder("gateway_downstream_timeouts_total")
                      .description("Total downstream timeouts by service")
                      .tag("service", k)
                      .register(_meterRegistry))
          .increment();
    }
  }
}
