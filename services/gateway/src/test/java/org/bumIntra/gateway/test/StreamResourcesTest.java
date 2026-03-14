package org.bumIntra.gateway.test;

import static io.restassured.RestAssured.given;

import org.bumIntra.gateway.client.StreamChatService;
import org.junit.jupiter.api.Test;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;

@QuarkusTest
public class StreamResourcesTest {

	@InjectMock
	StreamChatService streamChatService;

	@Test
	public void testStreamChat() {
		given()
				.when().get("/stream/unknown/test")
				.then()
				.statusCode(404);
	}

}
