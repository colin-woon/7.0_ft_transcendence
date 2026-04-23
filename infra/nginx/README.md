# Nginx Reverse Proxy

This directory contains the public edge proxy configuration for the platform.

Current files:

- [`nginx.prod.conf`](./nginx.prod.conf)
- [`nginx.dev.conf`](./nginx.dev.conf)

Nginx is the user-facing entry layer. It sits in front of the web app, gateway, and selected observability tools.

---

## Responsibilities

The current Nginx layer is responsible for:

- terminating browser-facing TLS on `443`
- redirecting plain HTTP on `80` to HTTPS
- proxying:
  - `/` -> web service
  - `/api/` -> gateway
  - `/api/stream/` -> gateway SSE endpoints
  - `/prometheus/` -> Prometheus
  - `/grafana/` -> Grafana
- forwarding trusted client metadata to downstream services
- disabling buffering for SSE traffic
- maintaining upstream keepalive pools with Docker DNS re-resolution

It is not the application auth layer. Browser auth, RBAC, and downstream policy enforcement happen behind Nginx.

---

## Runtime Split

### Production

Config:

- [`nginx.prod.conf`](./nginx.prod.conf)

Behavior:

- browser-facing TLS enabled
- upstream gateway/web/prometheus/grafana are reached over HTTPS
- mTLS is used for:
  - nginx -> gateway
  - nginx -> web
  - nginx -> prometheus
- Grafana is currently upstream TLS with CA verification, but without nginx presenting a client certificate
- upstream TLS hostname verification is explicitly pinned with `proxy_ssl_name`

### Development

Config:

- [`nginx.dev.conf`](./nginx.dev.conf)

Behavior:

- browser-facing TLS still enabled
- upstream services are reached over plain HTTP
- no upstream mTLS in dev
- same route layout as prod
- same SSE and keepalive behavior

This keeps the browser entrypoint stable in dev while relaxing internal transport for faster iteration.

---

## Public Route Map

Current route mapping:

| Public Path | Upstream |
| --- | --- |
| `/health` | local Nginx 200 response |
| `/api/stream/` | gateway stream routes |
| `/api/` | gateway main API |
| `/prometheus/` | Prometheus |
| `/grafana/` | Grafana |
| `/` | web frontend |

The `/health` endpoint is local to nginx and is used by the container healthcheck.

---

## Upstream Design

Both dev and prod now use named upstream blocks with:

- `resolver 127.0.0.11 ipv6=off valid=10s;`
- `zone ...`
- `server ... resolve;`
- `keepalive ...`

Example pattern:

```nginx
upstream gateway_service_upstream {
    zone gateway_service_upstream 64k;
    server gateway-service:8443 resolve;
    keepalive 64;
}
```

Why this shape is used:

- Docker service IPs can change
- `resolve` lets nginx re-resolve container hostnames
- `keepalive` preserves reusable upstream connections
- `zone` keeps upstream runtime state in shared memory

This replaced the older variable-based `proxy_pass` pattern because that fixed DNS churn but dropped upstream keepalive pooling.

---

## TLS Behavior

### Browser-facing TLS

Both dev and prod serve HTTPS using:

- `/etc/nginx/certs/nginx-internal.crt`
- `/etc/nginx/certs/nginx-internal.key`

The `80 -> 443` redirect is hard-coded to:

```nginx
return 308 https://localhost$request_uri;
```

So the current configs assume local access through `https://localhost`.

### Upstream TLS in Production

Production locations using HTTPS upstreams also configure:

- `proxy_ssl_trusted_certificate`
- `proxy_ssl_verify on`
- `proxy_ssl_verify_depth 2`
- `proxy_ssl_session_reuse on`
- `proxy_ssl_server_name on`
- `proxy_ssl_name <real-service-name>`

The `proxy_ssl_name` lines are important. They were added because once upstreams were converted back to named `upstream` blocks, nginx started verifying certificates against the upstream block name instead of the actual container hostname. The explicit `proxy_ssl_name` values fix that mismatch.

Current values:

- gateway -> `gateway-service`
- web -> `web-service`
- prometheus -> `prometheus-service`
- grafana -> `grafana-service`

---

## Forwarded Headers

For app routes, nginx forwards:

- `Host`
- `X-Intra-Real-IP`
- `X-Intra-Forwarded-For`
- `X-Intra-Forwarded-Proto`
- `X-Intra-Forwarded-Host`

These headers are used by the gateway to reconstruct:

- client IP
- forwarded host/proto
- request context for downstream propagation and observability

For Grafana and Prometheus routes, forwarding is lighter and focused on host/proto/prefix behavior instead of the application-specific `X-Intra-*` chain.

---

## SSE Behavior

`/api/stream/` has special tuning for server-sent events:

- `proxy_http_version 1.1`
- `proxy_set_header Connection ""`
- `proxy_set_header X-Accel-Buffering no`
- `proxy_buffering off`
- `proxy_cache off`
- `chunked_transfer_encoding on`
- `tcp_nopush off`
- `tcp_nodelay on`
- long read/send timeouts

Purpose:

- keep the stream live
- avoid response buffering
- flush events promptly
- avoid breaking SSE delivery with proxy-side caching or buffering

The gateway remains the SSE proxy. Nginx only preserves the streaming behavior.

---

## Observability Surface

The nginx configs currently include convenience proxy routes for local access to observability tools:

- `/prometheus/`
- `/grafana/`

These are not meant to be permanently exposed by default. Both configs also include commented hard-block rules:

```nginx
# location = /metrics { return 404; }
# location ^~ /prometheus/ { return 404; }
# location ^~ /grafana/ { return 404; }
```

Intended posture:

- keep the proxy routes enabled when you want convenient browser access to Prometheus and Grafana
- comment those route blocks out and restore the hard-block rules when you do not want them exposed

So the observability surface is intentionally easy to toggle between:

- convenient local access
- explicit hard denial at the nginx edge

---

## Compose Wiring

Nginx is mounted from Compose:

- prod:
  - [`docker-compose.yml`](../../docker-compose.yml)
  - mounts [`nginx.prod.conf`](./nginx.prod.conf)
- dev:
  - [`docker-compose.override.yml`](../../docker-compose.override.yml)
  - overrides with [`nginx.dev.conf`](./nginx.dev.conf)

Healthcheck:

```yaml
curl -fk https://localhost/health
```

Current cert mounts in prod include:

- nginx cert/key
- CA cert

Dev reuses the nginx TLS termination certs for the browser-facing endpoint, but internal upstreams stay plain HTTP.

---

## Current Footguns

### 1. Upstream TLS Name Mismatch

If you add or rename HTTPS upstream blocks in prod and forget `proxy_ssl_name`, nginx can start returning `502` with certificate mismatch errors even though DNS and service reachability are fine.

### 2. Manual Compose Without `--env-file`

The repo’s Make targets use `--env-file ./environment/shared.env`. If you run Compose manually without the same env file, some services may come up with missing env substitutions and fail in less obvious ways.

### 3. Hard-coded `localhost` Redirect

The HTTP-to-HTTPS redirect currently forces:

```nginx
https://localhost$request_uri
```

That is acceptable for the current local/dev workflow, but it is not a generic host-preserving redirect config.

### 4. Grafana Is Not Full mTLS

Prometheus, gateway, and web upstreams use nginx client certificates in prod. Grafana currently does not. Do not document Grafana as full mutual TLS unless that upstream is updated accordingly.

---

## Source of Truth

When updating nginx docs, prefer these files over broader architecture notes:

- [`nginx.prod.conf`](./nginx.prod.conf)
- [`nginx.dev.conf`](./nginx.dev.conf)
- [`docker-compose.yml`](../../docker-compose.yml)
- [`docker-compose.override.yml`](../../docker-compose.override.yml)

The configs above are the authoritative source for current nginx behavior.
