# Redis Infra

This directory owns the Redis setup used by the API gateway for rate limiting.

Right now Redis is **not** a general-purpose cache for the whole stack.
Its current role is narrow:

- backing store for gateway token-bucket rate limiting

There is one Redis container in Compose:

- `gw-redis-service`

## What Lives Here

### Gateway Redis image

[`gateway-redis/Dockerfile`](./gateway-redis/Dockerfile) builds a thin Redis image on top of `redis:7.4.7-alpine`.

Current runtime flags:

- `--save ""`
- `--appendonly no`
- `--maxmemory-policy noeviction`
- `--tcp-keepalive 60`
- `--timeout 0`

That means:

- there is **no RDB snapshot persistence**
- there is **no AOF persistence**
- rate-limit state is in-memory only
- Redis will not evict keys under memory pressure

For this project, that is acceptable because the data stored here is temporary rate-limit state, not source-of-truth application data.

## Compose Wiring

`gw-redis-service` is defined in:

- [`docker-compose.yml`](../../docker-compose.yml)

Current shape:

- build context: `./infra/redis/gateway-redis`
- restart: `always`
- profiles:
  - `gw-redis`
  - `gateway`
  - `all`
- healthcheck:
  - `redis-cli ping`

The gateway depends on Redis health before starting.

### Dev mode

In development override:

- [`docker-compose.override.yml`](../../docker-compose.override.yml)

Redis is also exposed on:

- `6379:6379`

That is mainly for local inspection and debugging.

## How the Gateway Uses Redis

The gateway rate-limit configuration lives in:

- [`services/gateway/src/main/resources/application.properties`](../../services/gateway/src/main/resources/application.properties)

Current relevant settings:

- `quarkus.redis.hosts=${GW_REDIS_URL:redis://localhost:6379}`
- `quarkus.redis.timeout=1s`
- `gateway.config.ratelimit.enabled=true`
- `gateway.config.ratelimit.limit=60`
- `gateway.config.ratelimit.window=60s`

The actual Redis-backed limiter lives in:

- [`RedisTokenBucketRateLimiter.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/RedisTokenBucketRateLimiter.java)

It uses:

- [`RedisScriptRegistry.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/RedisScriptRegistry.java)
- [`token_bucket.lua`](../../services/gateway/src/main/resources/redis/token_bucket.lua)

The Lua script is loaded at startup and reloaded if Redis returns `NOSCRIPT`.

## Key Shape

The request filter currently builds Redis keys in:

- [`RequestRateLimitFilter.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java)

Current shape:

- `ACCESS_CLASS + ":" + sha256(identityKey)`

Where:

- `ACCESS_CLASS` comes from [`DefaultRateLimitResolver.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/DefaultRateLimitResolver.java)
- `identityKey` comes from [`GatewayRequestContext.getRateLimitKey()`](../../services/gateway/src/main/java/org/bumIntra/gateway/security/GatewayRequestContext.java)

Current identity sources:

- `SERVICE` -> `internal:<serviceName>`
- authenticated user/admin -> `user:<userId>`
- guest fallback -> `ip:<clientIp>`

If the identity key is null or blank, the filter currently falls back to:

- `ACCESS_CLASS:unknown`

The hash is used so Redis does not store raw user IDs, IPs, or service names directly in the key itself.

## Access Profiles

Rate-limit capacity is access-class based, not endpoint specific.

Current profiles in:

- [`RateLimitProfiles.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/RateLimitProfiles.java)

Current behavior:

- `GUEST` -> one-third of base limit
- `USER` -> base limit
- `ADMIN` -> ten times base limit
- `SERVICE` -> ten times base limit

With current defaults:

- base limit: `60`
- window: `60s`

That means the effective nominal capacities are:

- guest: `20`
- user: `60`
- admin: `600`
- service: `600`

## Token Bucket Semantics

The Redis script stores bucket state as a small hash:

- `tokens`
- `ts`

It refills over time and consumes one token per request.

The script also applies a TTL long enough for an empty bucket to refill.
Current TTL logic is:

- `ttl_ms = (capacity / refill_rate) * 2`

So idle buckets naturally expire instead of accumulating forever.

## Operational Implications

### Restarting Redis clears rate-limit state

Because persistence is disabled:

- restarting `gw-redis-service`
- recreating the container
- flushing Redis manually

will all clear current bucket state.

That means every caller effectively gets a fresh bucket after Redis restarts.

For this project, that is acceptable.

### Old bucket keys linger only until TTL

If the gateway keying scheme changes, old Redis keys are not automatically migrated or deleted.

They simply age out according to the Lua-script TTL.

In most cases that is enough and a flush is not necessary.

### Redis outage currently fails closed

If the gateway cannot evaluate the Redis script successfully, the Redis-backed rate limiter returns `false`.

In practice that means requests are treated as not allowed when Redis execution fails.

That is safer than silently disabling rate limiting, but it also means Redis availability directly affects gateway availability for rate-limited traffic.

### `noeviction` is intentional

The Redis image uses:

- `--maxmemory-policy noeviction`

That avoids silently dropping bucket state under memory pressure.

If memory becomes constrained, failures should be explicit rather than hidden by eviction behavior.

## Operational Notes

### This Redis is gateway-specific

Do not treat this instance as shared application cache unless the design changes intentionally.

Right now it is scoped to gateway rate limiting only.

### Bucket identity depends on gateway request context

The Redis layer only stores the key it receives.

If upstream request context is degraded:

- blank service name
- missing user ID
- missing client IP

the filter can collapse callers into fallback buckets such as `unknown`.

This is primarily a gateway-context concern, but it affects how rate-limit buckets are partitioned.

### Dev and prod topology differ slightly

In dev:

- Redis is published on host port `6379`

In prod Compose:

- Redis stays internal on the Compose network

So any direct local inspection flow that depends on host port `6379` is a dev convenience, not the production shape.

## Related Files

- [`gateway-redis/Dockerfile`](./gateway-redis/Dockerfile)
- [`docker-compose.yml`](../../docker-compose.yml)
- [`docker-compose.override.yml`](../../docker-compose.override.yml)
- [`services/gateway/src/main/resources/application.properties`](../../services/gateway/src/main/resources/application.properties)
- [`services/gateway/src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/filter/RequestRateLimitFilter.java)
- [`services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/RedisTokenBucketRateLimiter.java`](../../services/gateway/src/main/java/org/bumIntra/gateway/ratelimit/RedisTokenBucketRateLimiter.java)
- [`services/gateway/src/main/resources/redis/token_bucket.lua`](../../services/gateway/src/main/resources/redis/token_bucket.lua)
