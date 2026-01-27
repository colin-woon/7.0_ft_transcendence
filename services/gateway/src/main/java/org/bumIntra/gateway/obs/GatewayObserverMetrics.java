package org.bumIntra.gateway.obs;

import java.time.Duration;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GatewayObserverMetrics implements GatewayObserver {

	private final MeterRegistry _meterRegistry;

	@Inject
	public GatewayObserverMetrics(MeterRegistry meterRegistry) {
		_meterRegistry = meterRegistry;
	}

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
}
