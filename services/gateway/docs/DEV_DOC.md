# Gateway — Developer Guide

These notes describe the current gateway codebase and the main implementation traps. They intentionally avoid older design notes that no longer match the service.

---

## Tooling

The gateway is a Quarkus JVM service under:

- [`services/gateway`](..)

Common local commands:

```bash
./mvnw quarkus:dev
./mvnw clean test
./mvnw clean package
```

In the repo workflow, gateway is usually run through the root `Makefile` and Compose targets.

---

## Current Package Layout

```text
src/main/java/org/bumIntra/gateway/
├── api/         GatewayResource, AdminResources, PublicResource, StreamResources
├── client/      REST clients, FT executors/wrappers, downstream service adapters
├── config/      Config mappings for auth, methods, headers, rate limiting
├── exception/   GatewayException, error codes, response mapping
├── filter/      Request/response/client filters
├── obs/         Observer dispatcher, logging, metrics
│   └── event/   Request lifecycle event records
├── ratelimit/   Access resolver, profiles, Redis limiter, Lua registry
└── security/    GatewayRequestContext, AuthLevel, internal header constants
```

---

## Core Request State

[`GatewayRequestContext`](../src/main/java/org/bumIntra/gateway/security/GatewayRequestContext.java) is the request-scoped state shared across filters and downstream client calls.

Important fields:

- `requestId`
- `startTime`
- `path`
- `pathType`
- `serviceName`
- `headers`
- `queryParams`
- `clientIp`
- `realIp`
- `forwardedFor`
- `forwardedHost`
- `forwardedProto`
- `userId`
- `roles`
- `authLevel`
- `errorCode`
- `errorStatus`

It is also where the current rate-limit identity key is derived.

---

## Filter Ordering

Current effective order:

| Priority                  | Filter                       | Role                                            |
| ------------------------- | ---------------------------- | ----------------------------------------------- |
| `AUTHENTICATION - 100`    | `RequestContextFilter`       | normalize request, build context, emit start    |
| `AUTHENTICATION - 90`     | `RequestMethodAllowFilter`   | reject unsupported methods                      |
| `AUTHENTICATION - 80`     | `RequestHeaderAllowFilter`   | strip disallowed inbound headers                |
| `AUTHENTICATION - 79`     | `RequestBodyAllowFilter`     | enforce configured request body size limits     |
| `AUTHENTICATION - 70`     | `RequestPreAuthFilter`       | parse cookie JWT, classify public/internal/auth |
| `AUTHORIZATION - 100`     | `RequestRateLimitFilter`     | consume token bucket                            |
| `AUTHORIZATION - 90`      | `RequestRBACFilter`          | guard `/admin/`                                 |
| `HEADER_DECORATOR - 100`  | `ServiceClientContextFilter` | decorate downstream client requests             |
| `HEADER_DECORATOR + 1000` | `ResponseContextFilter`      | emit end event / response context               |
| `HEADER_DECORATOR + 1050` | `ResponseHeaderStripFilter`  | strip outbound headers                          |
| `HEADER_DECORATOR + 1100` | `ResponseMDCCleanFilter`     | clear MDC                                       |

When adding a new filter, choose its priority based on where it must execute in the existing chain.

---

## Authentication Behavior

### Browser/User Auth

The gateway reads the browser access token from cookies:

```properties
mp.jwt.token.header=Cookie
mp.jwt.token.cookie=accessToken
```

[`RequestPreAuthFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestPreAuthFilter.java):

- extracts `accessToken` from the raw `Cookie` header
- parses the JWT locally
- fills:
    - `userId`
    - `roles`
    - `authLevel`

### Public Routes

Public routes are matched by prefix:

```properties
gateway.auth.public-paths=/api/public/
```

Public requests still attempt token parsing if a cookie is present, but they bypass the “user/admin required” enforcement.

### Internal/Service Auth

Internal requests are identified by the presence of a trusted internal header "`X-Intra-Internal-Request: true`".
This header is injected by trusted clients (e.g. other services in the cluster) and is not allowed(filtered) from external requests.

### Dev Caveat

`%dev.gateway.auth.required=false` disables auth enforcement in dev. This is convenient for local work, but it also means dev behavior can hide production auth problems unless you test through the stricter path deliberately.

---

## Downstream Routing

### Main API

[`GatewayResource`](../src/main/java/org/bumIntra/gateway/api/GatewayResource.java) proxies:

- `/api/auth/...`
- `/api/forum/...`
- `/api/chat/...`

### Public API

[`PublicResource`](../src/main/java/org/bumIntra/gateway/api/PublicResource.java) exposes only a narrow auth/public surface:

- OAuth login/callback GETs
- refresh
- password login/register

The login/callback GETs now use `proxyPublicGet(...)`, which intentionally bypasses FT retry/circuit-breaker handling. That split exists because OAuth/login GETs are not safe to blindly retry.

### Admin API

[`AdminResources`](../src/main/java/org/bumIntra/gateway/api/AdminResources.java) currently exposes:

- `/api/admin/prometheus/...`
- `/api/admin/grafana/...`

These routes are intended for authenticated admin-only browser access to observability tooling.

Current design notes:

- route-family RBAC is enforced by `RequestRBACFilter`
- Prometheus is reached with the gateway's mTLS client identity
- Grafana is reached over HTTPS with CA verification
- both upstreams are configured to operate under the `/api/admin/...` browser prefix

### SSE

[`StreamResources`](../src/main/java/org/bumIntra/gateway/api/StreamResources.java) only supports:

- `/api/stream/chat/...`

It proxies bytes from the upstream response stream and closes upstream resources on completion or disconnect.

---

## Fault Tolerance Design

The current FT stack is:

- [`ServiceCallExecutor`](../src/main/java/org/bumIntra/gateway/client/ServiceCallExecutor.java)
- [`FaultToleranceServiceCallExecutor`](../src/main/java/org/bumIntra/gateway/client/FaultToleranceServiceCallExecutor.java)
- [`FaultToleranceCallWrapper`](../src/main/java/org/bumIntra/gateway/client/FaultToleranceCallWrapper.java)

### Separation of Responsibilities

`ServiceCallExecutor`

- maps raw downstream HTTP and transport failures into `GatewayException`

`FaultToleranceServiceCallExecutor`

- applies retry/circuit-breaker policy
- classifies `GatewayException` into:
    - `RetryableServiceException`
    - `NonRetryableServiceException`

`FaultToleranceCallWrapper`

- unwraps FT wrapper exceptions back to the original `GatewayException`
- converts `CircuitBreakerOpenException` into `503 SERVICE_UNAVAILABLE`

### Current FT Scope

There are separate FT lanes for:

- auth
- forum
- chat

This keeps breaker state isolated per downstream dependency.

### Current Retryable Codes

- `SERVICE_TIMEOUT`
- `SERVICE_UNAVAILABLE`
- `SERVICE_SERVER_ERROR`
- `SERVICE_INVALID_RESPONSE`

Client-side downstream failures such as `401` or other `4xx` become `SERVICE_CLIENT_ERROR` and are intentionally non-retryable.

---

## Rate Limiting Design

Rate limiting is enforced by [`RequestRateLimitFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java).

### Access Class

Resolved from `AuthLevel` by [`DefaultRateLimitResolver`](../src/main/java/org/bumIntra/gateway/ratelimit/DefaultRateLimitResolver.java):

- `GUEST`
- `USER`
- `ADMIN`
- `SERVICE`

### Identity Key

Derived in [`GatewayRequestContext.getRateLimitKey()`](../src/main/java/org/bumIntra/gateway/security/GatewayRequestContext.java):

- `internal:{serviceName}`
- `user:{userId}`
- `ip:{clientIp}`

### Final Storage Key

The request filter hashes the identity key and prefixes it with the access class:

```text
{ACCESS_CLASS}:{sha256(identityKey)}
```

If the identity key is null/blank, it falls back to `unknown`.

### Current Profiles

[`RateLimitProfiles`](../src/main/java/org/bumIntra/gateway/ratelimit/RateLimitProfiles.java):

- guest: `base / 3`
- user: `base`
- admin: `base * 10`
- service: `base * 10`

---

## Request Body Limit Design

Request body limits are enforced by [`RequestBodyAllowFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestBodyAllowFilter.java).

### Config Shape

[`GatewayRequestBodyConfig`](../src/main/java/org/bumIntra/gateway/config/GatewayRequestBodyConfig.java) maps normalized path prefixes to `MemorySize` values.

Example:

```properties
gateway.config.body.path-max-size."/api/chat/message"=5K
gateway.config.body.path-max-size."/api/chat/message/request"=5K
```

### Matching Rules

- matching is prefix-based, not exact-path based
- both configured prefixes and request paths are normalized
- the longest matching prefix wins

### Enforcement Scope

Current filter behavior:

- skips `GET`, `HEAD`, and `OPTIONS`
- reads `Content-Length` when present
- rejects oversized requests with:
    - HTTP `413`
    - `PAYLOAD_TOO_LARGE`

This is an early gateway guard. It does not fully measure streamed/chunked bodies at this layer, so downstream services should still enforce the final payload rule.

---

## Header Forwarding Rules

### Client -> Gateway

`RequestHeaderAllowFilter` strips disallowed inbound headers based on:

- `gateway.config.headers.request-deny-prefixes`

Current deny prefixes:

- `x-intra-`
- `x-forwarded-`

This prevents clients from spoofing trusted internal headers.

### Gateway -> Downstream

`ServiceClientContextFilter` forwards selected user-facing headers and injects trusted internal headers.

Forwarded:

- `Cookie`
- `Content-Type`
- `Accept`
- `Authorization`
- `Last-Event-ID`

Injected:

- `X-Intra-Request-Id`
- `X-Intra-Auth-Level`
- `X-Intra-User-Id`
- `X-Intra-User-Roles`
- `X-Intra-Internal-Request`
- forwarding metadata headers

---

## Observability Notes

### Logs

Current observer logs are only request-lifecycle logs:

```text
gw.start ...
gw.end ...
```

### Metrics

Current metric names:

- `gateway_http_requests_total`
- `gateway_http_errors_total`
- `gateway_http_request_duration_seconds`
- `gateway_downstream_timeouts_total`

One useful implementation detail:

- the `downstream` label is `cb_fast_fail` when the circuit breaker opens before a downstream call happens

That label is what the current Grafana/alerting work is built around.

---

## Current Dev/Config Caveats

### JWT Issuer Drift

Gateway and auth must agree on JWT issuer values. If auth mints tokens with one issuer and gateway verifies against another, browser flows can succeed through OAuth but later fail when the gateway parses the cookie token.

### Dev Auth Toggle

Because `%dev.gateway.auth.required=false`, local route behavior can be more permissive than prod. Be careful when debugging auth/redirect problems: some failures happen in Quarkus security before the request ever reaches your resource method.

### Compose Env Source

This repo relies on Compose `--env-file ./environment/shared.env` in the root `Makefile`. If you run `docker compose` manually without the same `--env-file`, gateway/auth config may silently lose required env values.

---

## When To Clean Rebuild

Do a clean rebuild after structural changes to:

- CDI wiring
- observer event records
- injected filter/client types
- Quarkus config-driven auth behavior

Recommended:

```bash
./mvnw clean package
```

or the equivalent root `make`/Compose rebuild path.
