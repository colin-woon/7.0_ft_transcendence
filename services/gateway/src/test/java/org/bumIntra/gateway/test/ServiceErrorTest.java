package org.bumIntra.gateway.test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.when;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.bumIntra.gateway.client.AuthClient;
import org.bumIntra.gateway.exception.GatewayErrorCode;
import org.bumIntra.gateway.exception.GatewayErrorMessageResolver;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class ServiceErrorTest {

  // @InjectMock ServiceCallExecutor ex;

  @InjectMock @RestClient AuthClient auth;

  @Test
  public void testServiceClientError() {

    when(auth.proxyGet("auth/clientError"))
        .thenThrow(
            new WebApplicationException(
                Response.status(400)
                    .entity("{\"detail\":\"errorMsg\"}")
                    .type("application/json")
                    .build()));

    given()
        .when()
        .get("api/auth/clientError")
        .then()
        .statusCode(400)
        .body("code", equalTo("SERVICE_CLIENT_ERROR"))
        .body("message", equalTo("Service client error: errorMsg"));
  }

  @Test
  public void testServiceClientErrorNoDetail() {

    when(auth.proxyGet("auth/clientErrorNoDetail"))
        .thenThrow(
            new WebApplicationException(
                Response.status(400)
                    .entity("{\"error\":\"errorMsg\"}")
                    .type("application/json")
                    .build()));

    given()
        .when()
        .get("api/auth/clientErrorNoDetail")
        .then()
        .statusCode(400)
        .body("code", equalTo("SERVICE_CLIENT_ERROR"))
        .body(
            "message",
            equalTo(
                GatewayErrorMessageResolver.resolveMessage(GatewayErrorCode.SERVICE_CLIENT_ERROR)));
  }
}
