# Gateway Service - AI Coding Agent Guide

## Architecture Overview

**This is an API Gateway built with Quarkus 3.30.5 (Java 21)**. It sits between clients and downstream services (e.g., auth service), providing routing, authentication, rate limiting, and security policy enforcement. **The gateway owns NO business logic** - it delegates all domain operations to backend services.

### Request Processing Pipeline (Filter Chain Order)

Filters execute in **priority order** (lower numbers = earlier execution). Use `@Priority(Priorities.AUTHENTICATION - N)` pattern:

```
-100  RequestContextFilter        → Extract request ID, client IP
 -90  MethodAllowListFilter       → Block disallowed HTTP methods
 -80  RequestHeaderAllowListFilter → Strip dangerous inbound headers
 -70  RateLimitFilter             → Token bucket rate limiting
 -60  PolicyEngineFilter          → Execute ordered policies
 -50  ServiceAuthFilter           → Validate auth via AuthService
```

**Response filters** run in reverse (higher priority = earlier on response path).

### Key Architecture Patterns

#### 1. **Fault-Tolerant Service Calls**
All downstream calls use `FaultToleranceServiceCallExecutor` with:
- **Circuit breaker**: 50% failure threshold, 2s delay, 4 request minimum
- **Retry**: 3 total attempts (initial + 2 retries), 150ms delay with 50ms jitter
- **Retryable errors**: `SERVICE_TIMEOUT`, `SERVICE_UNAVAILABLE`, `SERVICE_SERVER_ERROR`

```java
// Always wrap REST client calls
@Inject FaultToleranceServiceCallExecutor executor;
AuthResult result = executor.execute(() -> authClient.verify(token));
```

#### 2. **GatewayRequestContext (Request-Scoped)**
Thread-safe context object (`@RequestScoped`) shared across filters/routes:
- Stores: auth token, user ID, roles, client IP, request ID, rate limit key
- Use `getRateLimitKey()` for composite keys (auth token OR IP)
- Set errors via `setError(code, status)` for observability

#### 3. **Policy Engine Pattern**
Policies implement `GatewayPolicy` with explicit ordering (0-99: pre-auth, 100-199: auth, 200+: post-auth). PolicyEngineFilter auto-discovers and sorts all implementations:

```java
@ApplicationScoped
public class AuthRequiredPolicy implements GatewayPolicy {
    public int order() { return 100; } // auth-level
    public void evaluate(GatewayRequestContext ctx) { /* check auth */ }
}
```

#### 4. **Typed Configuration with @ConfigMapping**
Use SmallRye `@ConfigMapping` (not `@ConfigProperty`) for configuration classes:

```java
@ConfigMapping(prefix = "gateway.config.ratelimit")
public interface GatewayRateLimitConfig {
    @WithDefault("60") long limit();
    Duration window();
}
```

Profiles via `%dev.` or `%prod.` prefixes in [application.properties](src/main/resources/application.properties).

## Directory Structure & Responsibilities

See [gateway.md](src/main/java/org/bumIntra/gateway/gateway.md) for detailed folder responsibilities:

- **`api/`**: Incoming HTTP endpoints (no business logic, just routing)
- **`client/`**: Outbound REST clients to downstream services (MicroProfile REST Client)
- **`filter/`**: JAX-RS filters for cross-cutting concerns (auth, headers, rate limiting)
- **`policy/`**: Policy engine implementations (ordered evaluations)
- **`config/`**: Typed configuration classes (`@ConfigMapping`)
- **`exception/`**: Custom exceptions + `GatewayExceptionMapper` for standardized error responses
- **`security/`**: `GatewayRequestContext`, rate limiting, identity models

## Critical Development Workflows

### Build & Run
```bash
# Dev mode (hot reload)
./mvnw quarkus:dev
# Dev UI at http://localhost:8080/q/dev/

# Package JVM mode
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Native build (requires GraalVM or Docker)
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

### Environment Setup
**Use SDKMAN for Java/Maven versioning** (see [DEV_DOC.md](docs/DEV_DOC.md)):
```bash
sdk env install  # Install from .sdkmanrc
sdk env          # Activate environment
```
Enable auto-env in `~/.sdkman/etc/config`: `sdkman_auto_env=true`

### Testing
- Use [testcall.sh](testcall.sh) for manual gateway testing scenarios
- Auth service mock responds based on `Authorization` header value (e.g., "401" → 401 response)

## Project-Specific Conventions

### Error Handling
1. **Throw `GatewayException`** with status + error code:
   ```java
   throw new GatewayException(Response.Status.UNAUTHORIZED, 
       GatewayErrorCode.AUTH_INVALID, "Token expired");
   ```
2. `GatewayExceptionMapper` auto-converts to standardized JSON response with request ID
3. Service call errors wrapped by `FaultToleranceServiceCallExecutor` → mapped to gateway error codes

### Filter Naming & Priority
- Filters named `<Purpose>Filter.java` (e.g., `ServiceAuthFilter`)
- Request filters: `@Priority(Priorities.AUTHENTICATION - N)` where N determines order
- Response filters: `@Priority(Priorities.HEADER_DECORATOR + N)`
- Always add inline comment explaining priority choice

### Security Headers
- **Inbound allowlist** (configurable): Only `accept`, `content-type`, `authorization`, `user-agent`, `x-request-id` pass through
- **Deny prefixes**: Block `x-internal-*`, `x-bumintra-*`, `x-envoy-*` from clients
- **Outbound stripping**: Remove `server`, `via`, `x-powered-by`, `x-internal-*` from backend responses

### Rate Limiting
- Token bucket algorithm via `InMemTokenBucketRateLimiter`
- Key scheme: `ip-auth` (composite: auth token preferred, fallback to IP)
- Profile-based limits via `RateLimitProfiles` (injectable)

## Integration Points

### Downstream Services
- **AuthService**: Token validation at `${services.auth.url}/verify`
  - Configured via `quarkus.rest-client.auth-service.url`
  - Returns `AuthResult(sub, roles)` or throws 401/403
  - Timeouts: 1s connect, 1s read (configurable)

### Observability
- **Metrics**: Prometheus at `/metrics` (management port 8180)
- **Health**: `/health` and `/ready` endpoints
- **Logging**: MDC-based request tracing (see `MDCResponseCleanFilter`)

## Common Tasks

### Adding a New Filter
1. Create `@Provider` class implementing `ContainerRequestFilter`
2. Set `@Priority(Priorities.AUTHENTICATION - N)` with comment explaining order
3. Inject `GatewayRequestContext` for shared state
4. Update this guide if filter introduces new pattern

### Adding a New Route
1. Create `@Path` resource in `api/`
2. Inject `FaultToleranceServiceCallExecutor` for downstream calls
3. Use `@RestClient` injected clients from `client/` package
4. NO business logic in route - delegate to backend services

### Adding a New Policy
1. Implement `GatewayPolicy` interface in `policy/`
2. Return appropriate `order()` value (0-99: pre-auth, 100-199: auth, 200+: post-auth)
3. Throw `GatewayException` on policy violation
4. Mark `@ApplicationScoped` for auto-discovery
