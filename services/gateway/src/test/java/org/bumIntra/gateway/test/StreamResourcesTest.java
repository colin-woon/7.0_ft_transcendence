package org.bumIntra.gateway.test;

import static io.restassured.RestAssured.given;
import static org.mockito.ArgumentMatchers.anyString;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;

import org.bumIntra.gateway.client.StreamChatService;
import org.junit.jupiter.api.Test;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@QuarkusTest
public class StreamResourcesTest {

	@InjectMock
	StreamChatService chat;

	@Test
	public void testStreamChat() {
		given()
				.header("Accept", "text/event-stream")
				.when().get("/api/stream/unknown/test")
				.then()
				.statusCode(404);
	}

	@Test
	public void testPreserveUnauthorized() {
		when(chat.proxyStream("test"))
				.thenReturn(Response.status(401).build());

		given().header("Accept", "text/event-stream")
				.when().get("/api/stream/chat/test")
				.then().statusCode(401);

		verify(chat).proxyStream("test");
	}

	@Test
	public void testServerErrorToBadGateway() {
		when(chat.proxyStream("test"))
				.thenReturn(Response.status(500).build());
		given().header("Accept", "text/event-stream")
				.when().get("/api/stream/chat/test")
				.then().statusCode(502);

		verify(chat).proxyStream("test");
	}

	@Test
	public void testSseSuccessWithHeader() {
		when(chat.proxyStream("test"))
				.thenReturn(Response
						.ok(new ByteArrayInputStream("data: hello\n\n".getBytes(StandardCharsets.UTF_8)))
						.type(MediaType.SERVER_SENT_EVENTS)
						.build());

		given()
				.header("Accept", "text/event-stream")
				.when().get("/api/stream/chat/test")
				.then()
				.statusCode(200)
				.header("Cache-Control", "no-cache")
				.contentType(containsString("text/event-stream"));

		verify(chat).proxyStream("test");
	}

	@Test
	public void testSseSuccessWithoutAcceptHeader() {
		when(chat.proxyStream("test"))
				.thenReturn(Response
						.ok(new ByteArrayInputStream("data: hello\n\n".getBytes(StandardCharsets.UTF_8)))
						.type(MediaType.SERVER_SENT_EVENTS)
						.build());

		given()
				.when().get("/api/stream/chat/test")
				.then()
				.statusCode(406)
				.header("X-Request-Id", notNullValue());

		verify(chat, never()).proxyStream(anyString());
	}

	@Test
	public void testLegacyStreamPathNoLongerSupported() {
		given()
				.header("Accept", "text/event-stream")
				.when().get("/stream/chat/test")
				.then()
				.statusCode(404);

		verify(chat, never()).proxyStream(anyString());
	}
}
