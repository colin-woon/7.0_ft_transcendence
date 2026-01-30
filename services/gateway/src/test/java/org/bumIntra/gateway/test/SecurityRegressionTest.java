package org.bumIntra.gateway.test;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.bumIntra.gateway.test.TestObserverCounts;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class SecurityRegressionTest {

	@Inject
	TestObserverCounts counts;

	@Test
	void spoofed_headers_are_stripped() {
		given()
				.header("X-Auth-Level", "USER")
				.header("X-User-Id", "999")
				.header("X-Internal-Debug", "1")
				.header("X-Normal", "ok")
				.when()
				.get("/__test/headers")
				.then()
				.statusCode(200)
				.body("$", not(hasKey("x-auth-level")))
				.body("$", not(hasKey("x-user-id")))
				.body("$", not(hasKey("x-internal-debug")))
				.body("x-normal[0]", equalTo("ok"));
	}

	@Test
	void identity_defaults_to_guest() {
		given()
				.when()
				.get("/__test/ctx")
				.then()
				.statusCode(200)
				.body("authLevel", equalTo("GUEST"));
	}

	@Test
	void lifecycle_events_are_exactly_once() {
		String rid = "test-rid-1";

		given()
				.header("X-Request-Id", rid)
				.when()
				.get("/__test/ctx")
				.then()
				.statusCode(200);

		org.junit.jupiter.api.Assertions.assertEquals(1, counts.starts(rid));
		org.junit.jupiter.api.Assertions.assertEquals(1, counts.ends(rid));
	}
}
