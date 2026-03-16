package org.acme.service;

import java.util.HashMap;
import java.util.Map;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import nl.basjes.parse.useragent.UserAgent;
import nl.basjes.parse.useragent.UserAgentAnalyzer;

@ApplicationScoped
public class DeviceParser {

	private static final Logger LOG = Logger.getLogger(DeviceParser.class);

	private final UserAgentAnalyzer analyzer;

	public DeviceParser() {
		this.analyzer = UserAgentAnalyzer.newBuilder()
			.hideMatcherLoadStats()
			.withCache(1000)
			.withFields(
				"DeviceClass",
				"AgentName",
				"OperatingSystemName",
				"DeviceBrand"
			)
			.build();
		LOG.info("UserAgent analyzer initialized");
	}

	/**
	 * Extracts readable device information from a raw User-Agent header.
	 */
	public Map<String, String> parse(String uaString) {
		UserAgent agent = analyzer.parse(uaString);
		Map<String, String> details = new HashMap<>();

		details.put("deviceType", normalize(agent.getValue("DeviceClass")));
		details.put("browser", normalize(agent.getValue("AgentName")));
		details.put("os", normalize(agent.getValue("OperatingSystemName")));
		details.put("brand", normalize(agent.getValue("DeviceBrand")));

		return details;
	}

	private String normalize(String value) {
		if (value == null || "Unknown".equals(value) || "??".equals(value)) {
			return null;
		}
		return value;
	}
}
