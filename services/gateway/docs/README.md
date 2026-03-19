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

| Port   | Purpose                                                     |
| ------ | ----------------------------------------------------------- |
| `8443` | HTTPS (mTLS required)                                       |
| `8180` | Management — health, metrics (plain HTTP, no mTLS required) |

---

## HTTP Request Pipeline

Filters execute in JAX-RS priority order (lower number = earlier):

```
Incoming HTTPS request
        │
        ▼
[900]  RequestContextFilter          — assign requestId, populate GatewayRequestContext, fire obs.onRequestStart
        │
[910]  RequestMethodAllowFilter      — reject disallowed HTTP methods (405)
        │
[920]  RequestHeaderAllowFilter      — strip inbound headers matching deny prefixes
        │
[930]  RequestPreAuthFilter          — verify JWT with local public key; populate userId/roles
        │
[1900] RequestRateLimitFilter        — token bucket (Redis); key = auth user or client IP
        │
[1910] RequestRBACFilter             — check permissions (e.g. /admin/ paths)
        │
        ▼
      Handler / Proxy (GatewayResource / StreamResources)
        │
        ▼
[3000] ResponseContextFilter         — echo X-Intra-Request-Id, fire obs.onRequestEnd
        │
[3050] ResponseHeaderStripFilter     — strip internal headers from response to client
        │
[3100] ResponseMDCCleanFilter        — clear MDC logging context
```

---

## WebSocket Pipeline (`/ws/chat`)

Handled via `WsChatServer` and specialized handlers (`WsAuthHandler`, `WsRateLimiter`, etc.).

```
Client connects (WSS)
        │
  @OnOpen
        ├─ Mark pending
        ├─ obs.onWsOpen
        ├─ CONN_IP rate limit      — 20 connections / 10s per IP
        ├─ Check Authorization header / JWT
        ├─ Local JWT verification
        ├─ CONN_USER rate limit    — 5 connections / 10s per user
        └─ Mark session "authenticated"

  @OnMessage
        ├─ Guard: session must be "authenticated"
        ├─ MSG rate limit          — 10 messages / 1s per userId
        │   ├─ Throttled: Terminate session (TRY_AGAIN_LATER) + obs.onWsThrottle
        │   └─ Allowed: echo / forward message (currently echos for testing)

  @OnClose  → obs.onWsClose
  @OnError  → obs.onWsError
```

---

## Authentication

Controlled by `gateway.auth.required` (default: `true`).

`RequestPreAuthFilter` uses **Quarkus SmallRye JWT** for local verification of Bearer tokens. On success it populates
`GatewayRequestContext` with:

- `userId` (from `sub` claim)
- `roles` (from `groups` claim)
- `authLevel` (set to `ADMIN` if groups contains "ADMIN", else `USER`)

Requests from internal IPs/headers are marked as `SERVICE` level.

---

## Rate Limiting (HTTP)

Implementation: **Redis token bucket** (`RedisTokenBucketRateLimiter`) via a Lua script.

| Access level | Limit formula          | Default (60 req / 60s config) |
| ------------ | ---------------------- | ----------------------------- |
| `GUEST`      | `base / 3` per window  | 20 req / 60s                  |
| `USER`       | `base` per window      | 60 req / 60s                  |
| `ADMIN`      | `base × 10` per window | 600 req / 60s                 |
| `SERVICE`    | `base × 10` per window | 600 req / 60s                 |

Key format: `{access}:{sha256(authToken or clientIp)}`

Config:

```properties
gateway.config.ratelimit.enabled=true
gateway.config.ratelimit.limit=60
gateway.config.ratelimit.window=60s
gateway.config.ratelimit.key-scheme=ip-auth
```

---

## Rate Limiting (WebSocket)

All WS rate limits use the same Redis token bucket logic. Profiles are defined in `WsRateLimitProfiles`:

| Check       | Profile                      | Trigger             |
| ----------- | ---------------------------- | ------------------- |
| `CONN_IP`   | 20 connections / 10s per IP  | `@OnOpen` pre-auth  |
| `CONN_USER` | 5 connections / 10s per user | `@OnOpen` post-auth |
| `MSG`       | 10 messages / 1s per user    | `@OnMessage`        |

**Note:** Unlike HTTP, WS rate limit violations currently result in immediate **session termination**.

---

## Identity Headers (Gateway → Backend Services)

Injected by `ServiceClientContextFilter` on every outgoing downstream request:

| Header                     | Value                                  |
| -------------------------- | -------------------------------------- |
| `X-Intra-Auth-Level`       | `GUEST` / `USER` / `ADMIN` / `SERVICE` |
| `X-Intra-User-Id`          | userId (USER/ADMIN only)               |
| `X-Intra-User-Roles`       | comma-separated roles                  |
| `X-Intra-Request-Id`       | request-scoped UUID                    |
| `X-Intra-Internal-Request` | `true` (SERVICE level only)            |
| `Authorization`            | forwarded Bearer token                 |

---

## Header Control

**Inbound (client → gateway):** Headers matching deny prefixes are stripped:

```properties
gateway.config.headers.request-deny-prefixes=x-intra-,x-forwarded-
```

**Outbound (gateway → client):** Internal/infra headers are stripped from responses:

```properties
gateway.config.headers.response-strip-headers=server,via,x-powered-by
gateway.config.headers.response-strip-prefixes=x-intra-,x-forwarded-
```

---

## Error Response Format

All gateway errors return JSON:

```json
{
	"timestamp": "2024-03-21T12:00:00.000Z",
	"status": 401,
	"error": "UNAUTHORIZED",
	"code": "AUTH_REQUIRED",
	"message": "Authentication is required",
	"requestId": "2c3a8267-c1a4-46a5-8a64-6b30b1d1677c"
}
```

| Error Code                 | HTTP Status | Meaning                              |
| -------------------------- | ----------- | ------------------------------------ |
| `AUTH_REQUIRED`            | 401         | No Authorization header              |
| `AUTH_INVALID`             | 401         | Token rejected by auth service       |
| `FORBIDDEN`                | 405 / 403   | Method not allowed / access denied   |
| `RATE_LIMITED`             | 429         | Token bucket exhausted               |
| `SERVICE_TIMEOUT`          | 504         | Downstream timed out                 |
| `SERVICE_UNAVAILABLE`      | 503         | Downstream unreachable               |
| `SERVICE_INVALID_RESPONSE` | 502         | Downstream returned invalid response |
| `SERVICE_CLIENT_ERROR`     | 502         | Downstream returned 4xx              |
| `SERVICE_SERVER_ERROR`     | 502         | Downstream returned 5xx              |
| `GATEWAY_ERROR`            | 500         | Unexpected gateway-internal failure  |

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

| Metric                             | Type    | Description                        |
| ---------------------------------- | ------- | ---------------------------------- |
| `gateway_requests_total`           | Counter | All requests by result/errorCode   |
| `gateway_errors_total`             | Counter | Failed requests by errorCode       |
| `gateway_timeouts_total`           | Counter | Service timeout count              |
| `gateway_request_duration_seconds` | Timer   | Request latency histogram          |
| `gateway_ws_open_total`            | Counter | WS sessions opened                 |
| `gateway_ws_close_total`           | Counter | WS sessions closed (by close code) |
| `gateway_ws_active_sessions`       | Gauge   | Current live WS sessions           |
| `gateway_ws_auth_success_total`    | Counter | Successful WS auths                |
| `gateway_ws_auth_failure_total`    | Counter | Failed WS auths                    |
| `gateway_ws_auth_duration_seconds` | Timer   | WS auth latency histogram          |
| `gateway_ws_throttle_total`        | Counter | WS throttle events by type         |
| `gateway_ws_errors_total`          | Counter | WS error events                    |

---

## Building & Running

### Local dev (no mTLS)

```bash
cd services/gateway
./mvnw quarkus:dev
# Available at http://localhost:8080
# Dev UI at http://localhost:8080/q/dev/
```

### Docker (via Makefile from repo root)

```bash
# Production:
make gateway         # build and start gateway container in prod mode
make rebuild         # rebuild and restart gateway

# Development:
make dev-gateway     # build and start gateway container in dev mode
make dev-rebuild     # rebuild and restart gateway in dev mode
```
