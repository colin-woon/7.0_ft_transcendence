# Gateway — Developer Notes

## Toolchain Setup

Java tooling is managed via **SDKMAN** so everyone on the team uses identical SDK versions.

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash

# Install versions declared in .sdkmanrc
sdk env install

# Activate for the current terminal
sdk env
```

To avoid re-running `sdk env` on every new terminal, enable auto-activation:
```bash
# ~/.sdkman/etc/config
sdkman_auto_env=true
```

---

## Project Structure

```
src/main/java/org/bumIntra/gateway/
├── api/             Dynamic HTTP proxies (GatewayResource, PublicResource, StreamResources)
├── client/          Outbound REST clients, fault tolerance, DTOs (AuthClient, ChatClient, etc.)
│   └── dto/         Shared DTOs (AuthResult - deprecated)
├── config/          @ConfigMapping beans (auth, rate limit, headers, methods)
├── exception/       GatewayException, error codes, error response, exception mapper
├── filter/          Inbound/outbound container filters (request + response pipeline)
├── obs/             Observer pattern: dispatcher, logging impl, metrics impl
│   └── event/       Event records (GatewayRequestStart/End, GatewayWsOpen/Auth/Throttle/Close)
├── policy/          GatewayPolicy interface + implementations (Currently disabled)
├── ratelimit/       RateLimiter interface, Redis + in-mem token-bucket impls, profiles, resolver
│   └── ws/          WS-specific rate limit service (WsRateLimitService, WsRateLimitProfiles)
├── security/        GatewayRequestContext (request-scoped), AuthLevel, IdentityHeaders
└── websocket/       WsChatServer endpoint + handlers (WsAuthHandler, WsSessionStateHandler, etc.)
```

---

## Key Concepts

### GatewayRequestContext

`@RequestScoped` CDI bean that acts as the per-request shared state between filters.

Key fields:
- `requestId` — UUID set by `RequestContextFilter`, echoed back to client as `X-Intra-Request-Id`
- `startTime` — Instant when the request started
- `auth` — raw Authorization header value
- `userId`, `roles`, `authLevel` — populated by `RequestPreAuthFilter`
- `clientIp`, `realIp`, `forwardedFor`, etc. — populated from headers
- `serviceName` — targeted downstream service name (for observability)
- `errorCode`, `errorStatus` — set when a `GatewayException` is mapped

`RequestContextFilter` also classifies `/api/stream/**` requests as `pathType=stream`.
For valid stream requests it requires `Accept: text/event-stream`; otherwise it throws
`GatewayException` with `SSE_ACCEPT_REQUIRED` and HTTP `406`.

### Observer / Dispatcher Pattern

```
GatewayObserver (interface)
    ├── GatewayObserverLogging   (@ApplicationScoped) — structured log lines
    └── GatewayObserverMetrics   (@ApplicationScoped) — Micrometer counters/timers

GatewayObserverDispatcher       (@ApplicationScoped, @Typed)
    — injects Instance<GatewayObserver>, fans out to all implementations
    — @Typed(GatewayObserverDispatcher.class) prevents it from being included in
      its own Instance<GatewayObserver> loop
```

Filters and the WS endpoint inject `GatewayObserverDispatcher` directly and call
the event methods (`onRequestStart`, `onWsOpen`, etc.).

### Policy Engine

> **Note:** The `PolicyEngineFilter` and `GatewayPolicyEngine` are currently **commented out/disabled**.
> Basic RBAC is currently handled by `RequestRBACFilter`.

### Rate Limiter

Production: `RedisTokenBucketRateLimiter` — executes a Lua script.
Access levels are resolved via `RateLimitAccessResolver` (default implementation uses `AuthLevel`).

Profiles are managed in `RateLimitProfiles`, providing different buckets for `GUEST`, `USER`, and `ADMIN/SERVICE`.

---

## Filter Priority Reference

| Priority Value | Filter                       | Direction |
|----------------|------------------------------|-----------|
| 900            | `RequestContextFilter`       | Request   |
| 910            | `RequestMethodAllowFilter`   | Request   |
| 920            | `RequestHeaderAllowFilter`   | Request   |
| 930            | `RequestPreAuthFilter`       | Request   |
| 1900           | `RequestRateLimitFilter`     | Request   |
| 1910           | `RequestRBACFilter`          | Request   |
| 2900           | `ServiceClientContextFilter` | Client    |
| 3000           | `ResponseContextFilter`      | Response  |
| 3050           | `ResponseHeaderStripFilter`  | Response  |
| 3100           | `ResponseMDCCleanFilter`     | Response  |

---

## Dev Mode Config (`%dev` profile)

When running `./mvnw quarkus:dev`, the `%dev.*` properties activate:

- Plain HTTP on port 8080 (no TLS)
- No inbound mTLS (`client-auth=none`)
- No outbound mTLS to backend services
- `gateway.auth.required=false` (auth bypass)
- Backend service URLs point to `localhost` equivalents (e.g. `${DEV_AUTH_SERVICE_URL}`)

These are never active in the Docker/prod image.

---

## Adding a New Observer

1. Implement the `GatewayObserver` interface (all methods have `default` no-ops)
2. Annotate with `@ApplicationScoped`
3. Done — the dispatcher picks it up automatically via `Instance<GatewayObserver>`

Example:
```java
@ApplicationScoped
public class GatewayObserverAudit implements GatewayObserver {
    @Override
    public void onRequestStart(GatewayRequestStart e) {
        // write to audit log
    }
}
```

---

## Common Pitfalls

**`NoClassDefFoundError` or stale `*_ClientProxy` classes after structural changes**
Quarkus generates CDI proxy and build-time helper classes into `target/`. After
structural CDI changes (bean signatures, record shapes, observer payloads, injected
types), stale generated classes can survive an incremental rebuild and cause confusing
runtime linkage/proxy errors.
Always use `mvn clean package` or `make rebuild-gateway` (which includes `clean`) after
those changes.

**Observer fires N times per request**
`GatewayObserverDispatcher` must have `@Typed(GatewayObserverDispatcher.class)`.
Without it, CDI registers it as a `GatewayObserver` too, so
`Instance<GatewayObserver>` includes the dispatcher itself — causing infinite recursion.
There is also a defensive runtime guard (`if (o != this)`), but `@Typed` is the main
CDI-level protection and should not be removed.

**WS throttle log spam**
The current implementation emits a throttle observer event on every rejected WS message
or connection attempt. `LAST_THROTTLE_AT` still exists in `WsSessionStateHandler`, but
the debounce logic is not currently enforced in `WsChatServer`.
If per-message throttling starts spamming logs or metrics under burst traffic, re-add a
per-session cooldown before documenting debounce behavior as active.
