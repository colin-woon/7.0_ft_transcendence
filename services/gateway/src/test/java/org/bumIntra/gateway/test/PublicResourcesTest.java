package org.bumIntra.gateway.test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.core.Response;
import org.bumIntra.gateway.client.AuthService;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class PublicResourcesTest {

  @InjectMock AuthService auth;

  @Test
  public void testGetSuccessLogic() {
    when(auth.proxyGet("api/public/auth/login/test")).thenReturn(Response.ok("logged in").build());

    given()
        .when()
        .get("/api/public/auth/login/test")
        .then()
        .statusCode(200)
        .body(equalTo("logged in"));
  }

  @Test
  public void testGetSuccessCallback() {
    when(auth.proxyGet("api/public/auth/callback/test"))
        .thenReturn(Response.ok("callback").build());

    given()
        .when()
        .get("/api/public/auth/callback/test")
        .then()
        .statusCode(200)
        .body(equalTo("callback"));
  }

  @Test
  public void testGetFailure() {
    given()
        .when()
        .get("/api/public/auth/unknown/test")
        .then()
        .statusCode(anyOf(equalTo(404), equalTo(405)));

    verify(auth, never()).proxyGet(anyString());
  }

  @Test
  public void testGetTraversalLikePathBlocked() {
    given()
        .when()
        .get("/api/public/auth/login/../me")
        .then()
        .statusCode(anyOf(equalTo(404), equalTo(405)));

    verify(auth, never()).proxyGet(anyString());
  }

  @Test
  public void testPostSuccess() {
    when(auth.proxyPost("auth/refresh", new byte[0])).thenReturn(Response.ok("refreshed").build());

    given()
        .when()
        .post("/api/public/auth/refresh")
        .then()
        .statusCode(200)
        .body(equalTo("refreshed"));
  }

  @Test
  public void testPostFailure() {
    given()
        .when()
        .post("/api/public/auth/refresh/me")
        .then()
        .statusCode(anyOf(equalTo(404), equalTo(405)));

    verify(auth, never()).proxyPost(anyString(), any(byte[].class));
  }
}
