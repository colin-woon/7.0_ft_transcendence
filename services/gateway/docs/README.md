# Gateway Service

The gateway is the single HTTP entry point for external application traffic after Nginx. It is a Quarkus-based reverse proxy that centralizes:

- route dispatch to `auth`, `forum`, and `chat`
- cookie-JWT pre-auth and RBAC checks
- request filtering and header hygiene
- Redis-backed rate limiting
- per-service fault tolerance for safe downstream reads
- SSE proxying for chat streams
- structured logging and Prometheus metrics

This document reflects the current implementation in `services/gateway/src/main/java`, not older architecture notes.

---

## Runtime Modes

### Production

- inbound HTTPS on `8443`
- inbound mTLS required
- management interface on `8180`
- outbound mTLS enabled for forum/chat and trust-store validation enabled for auth
- auth enforcement enabled

### Development

- plain HTTP on `8080`
- no inbound mTLS
- no outbound mTLS
- management on `8180`
- `gateway.auth.required=false`

The dev profile is intentionally looser for local iteration. It should not be treated as the production security model.

---

## Exposed Route Families

### Main API

`/api/{service}/...`

Handled by [`GatewayResource.java`](../src/main/java/org/bumIntra/gateway/api/GatewayResource.java).

Current routed services:

- `auth`
- `forum`
- `chat`

All standard methods are proxied:

- `GET`
- `POST`
- `DELETE`
- `PUT`
- `PATCH`

For auth, downstream paths are prefixed with `auth/`. For forum/chat, the gateway forwards the downstream subpath directly.

### Public API

`/api/public/...`

Handled by [`PublicResource.java`](../src/main/java/org/bumIntra/gateway/api/PublicResource.java).

Current public surface:

- `GET /api/public/ping`
- `GET /api/public/auth/login/{provider}`
- `GET /api/public/auth/callback/{provider}`
- `POST /api/public/auth/refresh`
- `POST /api/public/auth/password/login`
- `POST /api/public/auth/password/register`

Only the auth routes above are allowed on the public POST path.

### SSE Streams

`/api/stream/{service}/...`

Handled by [`StreamResources.java`](../src/main/java/org/bumIntra/gateway/api/StreamResources.java).

Current downstream stream support:

- `chat`

The gateway is a byte-stream proxy here. It does not generate SSE events itself.

---

## Request Pipeline

Filters execute in priority order:

1. [`RequestContextFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestContextFilter.java)

- normalizes the request path
- stores headers/query params in `GatewayRequestContext`
- derives `pathType` and target `serviceName`
- resolves client IP from `X-Intra-*` forwarding headers
- validates SSE `Accept: text/event-stream` for `/api/stream/**`
- emits `gw.start`

2. [`RequestMethodAllowFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestMethodAllowFilter.java)

- blocks methods outside `gateway.config.methods.allowed-methods`

3. [`RequestHeaderAllowFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestHeaderAllowFilter.java)

- removes denied inbound headers and prefixes before proxying

4. [`RequestPreAuthFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestPreAuthFilter.java)

- reads `accessToken` from the `Cookie` header
- parses JWT locally with the gateway public key
- sets `userId`, `roles`, and `authLevel`
- marks `/api/public/**` routes as public
- enforces auth on non-public routes when `gateway.auth.required=true`
- treats X.509 principal identity as `SERVICE` when present

5. [`RequestRateLimitFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java)

- resolves access class
- computes the limiter key
- consumes from the Redis token bucket

6. [`RequestRBACFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestRBACFilter.java)

- enforces `/admin/` access for `ADMIN`

7. Resource handler

- `GatewayResource`
- `PublicResource`
- `StreamResources`

8. [`ResponseContextFilter`](../src/main/java/org/bumIntra/gateway/filter/ResponseContextFilter.java)

- emits `gw.end`
- adds request-context response headers

9. [`ResponseHeaderStripFilter`](../src/main/java/org/bumIntra/gateway/filter/ResponseHeaderStripFilter.java)

- strips internal response headers before returning to clients

10. [`ResponseMDCCleanFilter`](../src/main/java/org/bumIntra/gateway/filter/ResponseMDCCleanFilter.java)

- clears MDC state

---

## Authentication Model

The gateway no longer depends on inbound Bearer headers for the main browser flow.

Current behavior:

- browser auth is primarily derived from the `accessToken` cookie
- the gateway parses JWTs locally using `JWTParser`
- authenticated users become:
    - `USER`
    - `ADMIN`
- service-authenticated internal requests can become:
    - `SERVICE`
- unauthenticated requests remain:
    - `GUEST`

Public routes under `/api/public/` bypass auth enforcement, but the gateway still attempts to parse an access token if one is present.

Important config:

- `mp.jwt.token.header=Cookie`
- `mp.jwt.token.cookie=accessToken`
- `mp.jwt.verify.publickey.location=publicKey.pem`

The JWT issuer in gateway config must match the issuer used by auth when minting tokens.

---

## Downstream Header Propagation

[`ServiceClientContextFilter`](../src/main/java/org/bumIntra/gateway/filter/ServiceClientContextFilter.java) adds context to downstream service calls.

Forwarded client headers:

- `Cookie`
- `Content-Type`
- `Accept`
- `Authorization`
- `Last-Event-ID`

Injected internal headers:

- `X-Intra-Request-Id`
- `X-Intra-Auth-Level`
- `X-Intra-User-Id`
- `X-Intra-User-Roles`
- `X-Intra-Internal-Request`
- `X-Intra-Real-IP`
- `X-Intra-Forwarded-For`
- `X-Intra-Forwarded-Host`
- `X-Intra-Forwarded-Proto`

This is how backend services receive trusted gateway-resolved identity and request metadata.

---

## Rate Limiting

Rate limiting is implemented by [`RequestRateLimitFilter`](../src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java) with [`RedisTokenBucketRateLimiter`](../src/main/java/org/bumIntra/gateway/ratelimit/RedisTokenBucketRateLimiter.java).

Access classes are resolved from `AuthLevel`:

- `GUEST`
- `USER`
- `ADMIN`
- `SERVICE`

Profiles from [`RateLimitProfiles.java`](../src/main/java/org/bumIntra/gateway/ratelimit/RateLimitProfiles.java):

| Access    | Formula     |
| --------- | ----------- |
| `GUEST`   | `base / 3`  |
| `USER`    | `base`      |
| `ADMIN`   | `base * 10` |
| `SERVICE` | `base * 10` |

Current identity key scheme from [`GatewayRequestContext.getRateLimitKey()`](../src/main/java/org/bumIntra/gateway/security/GatewayRequestContext.java):

- `SERVICE` -> `internal:{serviceName}`
- authenticated user/admin -> `user:{userId}`
- fallback guest -> `ip:{clientIp}`

Final Redis key shape:

```text
{ACCESS_CLASS}:{sha256(identityKey)}
```

If the identity key is null/blank, the filter falls back to:

```text
{ACCESS_CLASS}:unknown
```

Config:

```properties
gateway.config.ratelimit.enabled=true
gateway.config.ratelimit.limit=60
gateway.config.ratelimit.window=60s
```

---

## Fault Tolerance

Safe downstream reads are wrapped with MicroProfile Fault Tolerance in [`FaultToleranceServiceCallExecutor.java`](../src/main/java/org/bumIntra/gateway/client/FaultToleranceServiceCallExecutor.java).

Separate lanes exist for:

- `authExecute`
- `forumExecute`
- `chatExecute`

Current policy shape:

- retries: `maxRetries = 1`
- breaker trips only on retryable downstream failures
- downstream client errors (`4xx`) are classified as non-retryable and skipped by the breaker

Retryable gateway error codes:

- `SERVICE_TIMEOUT`
- `SERVICE_UNAVAILABLE`
- `SERVICE_SERVER_ERROR`
- `SERVICE_INVALID_RESPONSE`

Non-retryable examples:

- `SERVICE_CLIENT_ERROR`
- auth failures
- path validation failures

[`FaultToleranceCallWrapper.java`](../src/main/java/org/bumIntra/gateway/client/FaultToleranceCallWrapper.java) translates:

- wrapped retry/non-retry exceptions back into the original `GatewayException`
- `CircuitBreakerOpenException` into:
    - HTTP `503`
    - `SERVICE_UNAVAILABLE`

Important route split:

- public auth login/callback GETs use `proxyPublicGet(...)` and bypass FT retry
- normal auth GETs still go through the auth FT lane

---

## SSE Proxying

[`StreamResources.java`](../src/main/java/org/bumIntra/gateway/api/StreamResources.java) proxies upstream SSE responses from chat.

Current behavior:

- only `GET /api/stream/chat/...` is supported
- non-success upstream responses are normalized before being returned
- upstream `401`, `403`, and `404` are passed through
- other upstream failures become `502`
- the downstream `Response` and `InputStream` are closed with try-with-resources
- client disconnects cause the upstream stream to be closed; there is no special close message

This gateway does not frame or generate SSE payloads. That remains a chat-service concern.

---

## Error Mapping

[`ServiceCallExecutor.java`](../src/main/java/org/bumIntra/gateway/client/ServiceCallExecutor.java) maps downstream client and transport failures into `GatewayException`.

Main mappings:

| Source                                 | Gateway Code               | HTTP                  |
| -------------------------------------- | -------------------------- | --------------------- |
| downstream `4xx`                       | `SERVICE_CLIENT_ERROR`     | original `4xx` status |
| downstream `5xx`                       | `SERVICE_SERVER_ERROR`     | `502`                 |
| timeout                                | `SERVICE_TIMEOUT`          | `504`                 |
| invalid/malformed downstream response  | `SERVICE_INVALID_RESPONSE` | `502`                 |
| generic transport/connectivity failure | `SERVICE_UNAVAILABLE`      | `503`                 |

[`GatewayExceptionMapper.java`](../src/main/java/org/bumIntra/gateway/exception/GatewayExceptionMapper.java) serializes gateway failures into a consistent JSON envelope.

Response shape:

```json
{
	"timestamp": "2026-04-21T23:00:00.000Z",
	"status": 401,
	"error": "UNAUTHORIZED",
	"code": "AUTH_REQUIRED",
	"message": "Authentication is required",
	"requestId": "..."
}
```

---

## Observability

### Logs

[`GatewayObserverLogging.java`](../src/main/java/org/bumIntra/gateway/obs/GatewayObserverLogging.java) emits structured request lifecycle logs:

```text
gw.start requestId=... method=... path=... at=...
gw.end requestId=... httpStatus=... latency=... success=... errorCode=...
```

### Metrics

[`GatewayObserverMetrics.java`](../src/main/java/org/bumIntra/gateway/obs/GatewayObserverMetrics.java) exports:

- `gateway_http_requests_total`
- `gateway_http_errors_total`
- `gateway_http_request_duration_seconds`
- `gateway_downstream_timeouts_total`

Key labels include:

- `result`
- `error_code`
- `downstream`
- `service`
- `path`

The `downstream` label uses:

- `called` for normal downstream calls
- `cb_fast_fail` when the request was short-circuited before making a downstream call

---
