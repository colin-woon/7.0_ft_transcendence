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
├── api/             HTTP endpoints (PingResource, AuthResource, HealthResource)
├── client/          Outbound REST clients, fault tolerance executor, outbound filter, DTOs
│   └── dto/         Response DTOs (AuthResult, …)
├── config/          @ConfigMapping beans (auth, rate limit, headers, methods)
├── exception/       GatewayException, error codes, error response, exception mapper
├── filter/          Inbound/outbound container filters (request + response pipeline)
├── obs/             Observer pattern: dispatcher, logging impl, metrics impl
│   └── event/       Event records (GatewayRequestStart/End, GatewayWsOpen/Auth/Throttle/Close)
├── policy/          GatewayPolicy interface + implementations + engine
├── ratelimit/       RateLimiter interface, Redis + in-mem token-bucket impls, profiles, resolver
│   └── ws/          WS-specific rate limit service (WsRateLimitService, WsRateLimitProfiles)
├── security/        GatewayRequestContext (request-scoped), AuthLevel, IdentityHeaders
└── websocket/       ChatWebSocketEndPoint, AuthHandshakeConfig
```

---

## Key Concepts

### GatewayRequestContext

`@RequestScoped` CDI bean that acts as the per-request shared state between filters.
All filters read from and write to this, rather than passing data via request properties.

Key fields:
- `requestId` — UUID set by `RequestContextFilter`, echoed back to client
- `auth` — raw Authorization header value
- `userId`, `roles`, `authLevel` — populated by `ServiceAuthFilter` after successful auth
- `clientIp` — from `X-Forwarded-For` / `Remote-Addr`
- `errorCode`, `errorStatus` — set when a `GatewayException` is mapped

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

`GatewayPolicyEngine` collects all `GatewayPolicy` CDI beans, sorts them by `order()`,
and calls `evaluate(ctx)` on each in `PolicyEngineFilter`.

To add a new policy:
1. Implement `GatewayPolicy`
2. Annotate with `@ApplicationScoped`
3. Return a unique `order()` value (lower = earlier)

Current policies:
| Class                | Order | What it checks                  |
|----------------------|-------|---------------------------------|
| `AuthRequiredPolicy` | 100   | Rejects unauthenticated requests when `gateway.auth.required=true` |

### Rate Limiter

Production: `RedisTokenBucketRateLimiter` — executes a Lua `EVALSHA` script. If Redis
doesn't have the script loaded (`NOSCRIPT` error) it reloads via `RedisScriptRegistry`
and retries once. Failures are **fail-closed** (returns `false` → deny).

Dev alternative: `InMemTokenBucketRateLimiter` — uncomment in `RateLimitFilter` and
comment out the Redis one. No Redis dependency required.

---

## Filter Priority Reference

| Priority Value | Filter                       | Direction |
|----------------|------------------------------|-----------|
| 700            | `RequestContextFilter`       | Request   |
| 710            | `MethodAllowListFilter`      | Request   |
| 720            | `RequestHeaderAllowListFilter` | Request |
| 730            | `RateLimitFilter`            | Request   |
| 750            | `ServiceAuthFilter`          | Request   |
| 760            | `PolicyEngineFilter`         | Request   |
| 4000           | `ResponseContextFilter`      | Response  |
| 4050           | `ResponseHeaderStripFilter`  | Response  |
| (none)         | `MDCResponseCleanFilter`     | Response  |

`ServiceRequestContextFilter` is a **client** filter (outbound to downstream), not a
container filter — it has no priority conflict with the above.

---

## Dev Mode Config (`%dev` profile)

When running `./mvnw quarkus:dev`, the `%dev.*` properties in `application.properties`
automatically activate:

- Plain HTTP on port 8080 (no TLS)
- No inbound mTLS (`client-auth=none`)
- No outbound mTLS to auth service
- `gateway.auth.required=false` (auth bypass, can be toggled)
- Auth service URL points to `http://localhost:9000`

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

**`NoClassDefFoundError` on `*_ClientProxy` at startup**
CDI proxy classes are generated at `mvn package` time. If you add/change methods on a
`GatewayObserver` implementation and rebuild without `clean`, the proxy is stale.
Always use `mvn clean package` or `make rebuild-gateway` (which includes `clean`).

**Observer fires N times per request**
`GatewayObserverDispatcher` must have `@Typed(GatewayObserverDispatcher.class)`.
Without it, CDI registers it as a `GatewayObserver` too, so
`Instance<GatewayObserver>` includes the dispatcher itself — causing infinite recursion.

**WS throttle log spam**
`onWsThrottle` for `MSG` type is debounced per session with a 2-second cooldown stored
in `session.getUserProperties()`. Do not remove `LAST_THROTTLE_AT` tracking when editing
`onMessage`.
