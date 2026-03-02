# Gateway Service

The gateway is the single entry point for all external traffic in the bumIntra platform. It handles:

- **mTLS termination** — all inbound traffic requires mutual TLS
- **Authentication** — validates Bearer tokens with the auth service
- **Rate limiting** — token bucket via Redis for HTTP and WebSocket traffic
- **Header control** — strips forbidden inbound headers and internal headers from responses
- **Policy enforcement** — pluggable policy engine evaluated per request
- **WebSocket proxying** — authenticated, rate-limited WS sessions for the chat service
- **Observability** — structured logging and Prometheus metrics via a dispatcher pattern

Built with **Quarkus 3.x** on JVM (Java 21).

---

## Ports

| Port   | Purpose                                                      |
|--------|--------------------------------------------------------------|
| `8443` | HTTPS (mTLS required)                                        |
| `8180` | Management — health, metrics (plain HTTP, no mTLS required)  |

---

## HTTP Request Pipeline

Filters execute in JAX-RS priority order (lower number = earlier):

```
Incoming HTTPS request
        │
        ▼
[700]  RequestContextFilter          — assign requestId, populate GatewayRequestContext, fire obs.onRequestStart
        │
[710]  MethodAllowListFilter         — reject disallowed HTTP methods (405)
        │
[720]  RequestHeaderAllowListFilter  — strip inbound headers matching deny prefixes
        │
[730]  RateLimitFilter               — token bucket (Redis); key = auth token or client IP
        │
[750]  ServiceAuthFilter             — verify Bearer token with auth service; populate userId/roles
        │
[760]  PolicyEngineFilter            — run ordered GatewayPolicy chain
        │
        ▼
      Handler / Proxy
        │
        ▼
[4000] ResponseContextFilter         — echo X-Request-Id, fire obs.onRequestEnd
        │
[4050] ResponseHeaderStripFilter     — strip internal headers from response to client
        │
       MDCResponseCleanFilter        — clear MDC logging context
```

---

## WebSocket Pipeline (`/ws/chat`)

```
Client connects (WSS)
        │
  @OnOpen
        ├─ Resolve client IP (X-Forwarded-For)
        ├─ obs.onWsOpen
        ├─ CONN_IP rate limit      — 20 connections / 10s per IP
        ├─ Check Authorization header
        ├─ authService.verify(token)
        ├─ CONN_USER rate limit    — 5 connections / 10s per user
        └─ Mark session "authenticated", send {"type":"authenticated"}

  @OnMessage
        ├─ Guard: session must be "authenticated"
        ├─ MSG rate limit          — 10 messages / 1s per userId
        │   ├─ Throttled: send {"type":"throttled"} + obs.onWsThrottle (debounced 2s)
        │   └─ Allowed: echo / forward message

  @OnClose  → obs.onWsClose
  @OnError  → obs.onWsError
```

---

## Authentication

Controlled by `gateway.auth.required` (default: `true`).

`ServiceAuthFilter` calls `AuthService.verify(authorizationHeader)`. On success it populates
`GatewayRequestContext` with:

- `userId` (from `sub` claim)
- `roles`
- `authLevel = USER`

These are then forwarded downstream via identity headers (see below).

---

## Rate Limiting (HTTP)

Implementation: **Redis token bucket** (`RedisTokenBucketRateLimiter`) via a Lua script loaded into Redis.

| Access level | Limit formula           | Default (60 req / 60s config) |
|--------------|-------------------------|-------------------------------|
| `GUEST`      | `base / 3` per window   | 20 req / 60s                  |
| `USER`       | `base` per window       | 60 req / 60s                  |
| `SERVICE`    | `base × 10` per window  | 600 req / 60s                 |

Key format: `{access}:{authToken or clientIp}`

Config:
```properties
gateway.config.ratelimit.enabled=true
gateway.config.ratelimit.limit=60
gateway.config.ratelimit.window=60s
gateway.config.ratelimit.key-scheme=ip-auth
```

---

## Rate Limiting (WebSocket)

All WS rate limits use the same Redis token bucket. Profiles are hardcoded in `WsRateLimitProfiles`:

| Check       | Profile                     | Trigger                    |
|-------------|-----------------------------|----------------------------|
| `CONN_IP`   | 20 connections / 10s per IP | `@OnOpen` pre-auth         |
| `CONN_USER` | 5 connections / 10s per user | `@OnOpen` post-auth       |
| `MSG`       | 10 messages / 1s per user   | `@OnMessage`               |

Throttle observer events are **debounced per session** (2s cooldown) to avoid log spam on bursts.

---

## Identity Headers (Gateway → Backend Services)

Injected by `ServiceRequestContextFilter` on every outgoing downstream request:

| Header           | Value                               |
|------------------|-------------------------------------|
| `X-Auth-Level`   | `GUEST` / `USER` / `SERVICE`        |
| `X-User-Id`      | userId (USER level only)            |
| `X-User-Roles`   | comma-separated roles (USER only)   |
| `X-Request-Id`   | request-scoped UUID                 |
| `Authorization`  | forwarded Bearer token              |

---

## Header Control

**Inbound (client → gateway):** Headers matching deny prefixes are stripped before reaching auth/downstream:
```properties
gateway.config.headers.request-deny-prefixes=x-internal-,x-auth-,x-user-,x-service-,x-bumintra-,x-envoy-,x-forwarded-,x-authorization-
```

**Outbound (gateway → client):** Internal/infra headers are stripped from responses:
```properties
gateway.config.headers.response-strip-headers=server,via,x-powered-by
gateway.config.headers.response-strip-prefixes=x-internal-,x-bumintra-,x-envoy-,x-forwarded-
```

---

## Error Response Format

All gateway errors return JSON:

```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "code": "AUTH_REQUIRED",
  "message": "Authentication is required",
  "requestId": "2c3a8267-c1a4-46a5-8a64-6b30b1d1677c"
}
```

| Error Code                 | HTTP Status | Meaning                                |
|----------------------------|-------------|----------------------------------------|
| `AUTH_REQUIRED`            | 401         | No Authorization header                |
| `AUTH_INVALID`             | 401         | Token rejected by auth service         |
| `FORBIDDEN`                | 405 / 403   | Method not allowed / access denied     |
| `RATE_LIMITED`             | 429         | Token bucket exhausted                 |
| `SERVICE_TIMEOUT`          | 504         | Downstream timed out                   |
| `SERVICE_UNAVAILABLE`      | 503         | Downstream unreachable                 |
| `SERVICE_INVALID_RESPONSE` | 502         | Downstream returned invalid response   |
| `SERVICE_CLIENT_ERROR`     | 502         | Downstream returned 4xx                |
| `SERVICE_SERVER_ERROR`     | 502         | Downstream returned 5xx                |
| `GATEWAY_ERROR`            | 500         | Unexpected gateway-internal failure    |

---

## Observability

### Logging

Structured log lines from `GatewayObserverLogging`:

```
gw.start       requestId method path at
gw.end         requestId httpStatus latency(ms) success errorCode
gw.ws.open     sessionId ip at
gw.ws.auth     sessionId ip success userId latencyMs reason
gw.ws.throttle sessionId ip userId type key at
gw.ws.close    sessionId userId closeCode reason at
```

### Metrics (Prometheus — `/metrics`)

| Metric                             | Type    | Description                         |
|------------------------------------|---------|-------------------------------------|
| `gateway_requests_total`           | Counter | All requests by result/errorCode    |
| `gateway_errors_total`             | Counter | Failed requests by errorCode        |
| `gateway_timeouts_total`           | Counter | Service timeout count               |
| `gateway_request_duration_seconds` | Timer   | Request latency histogram           |
| `gateway_ws_open_total`            | Counter | WS sessions opened                  |
| `gateway_ws_close_total`           | Counter | WS sessions closed (by close code)  |
| `gateway_ws_active_sessions`       | Gauge   | Current live WS sessions            |
| `gateway_ws_auth_success_total`    | Counter | Successful WS auths                 |
| `gateway_ws_auth_failure_total`    | Counter | Failed WS auths                     |
| `gateway_ws_auth_duration_seconds` | Timer   | WS auth latency histogram           |
| `gateway_ws_throttle_total`        | Counter | WS throttle events by type          |
| `gateway_ws_errors_total`          | Counter | WS error events                     |

---

## Building & Running

### Local dev (no mTLS)
```bash
./mvnw quarkus:dev
# Available at http://localhost:8080
# Dev UI at http://localhost:8080/q/dev/
```

### Docker (via Makefile.gw from repo root)
```bash
make -f Makefile.gw build-gateway    # mvn clean package + docker build
make -f Makefile.gw rebuild-gateway  # clean rebuild, no-cache, restart container
make -f Makefile.gw up-d-gateway     # start existing image detached
```

> `Dockerfile.jvm` copies a pre-built `target/quarkus-app/` into the image — always run
> `mvn package` before rebuilding the Docker image. The `make build-*` / `rebuild-*`
> targets handle this automatically.
