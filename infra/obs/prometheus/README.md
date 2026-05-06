# Prometheus

This folder contains the Prometheus scrape, alerting, and web security configuration.

Files:

- [`prometheus.prod.yml`](./prometheus.prod.yml)
- [`prometheus.dev.yml`](./prometheus.dev.yml)
- [`alerts.yml`](./alerts.yml)
- [`web.prod.yml`](./web.prod.yml)
- [`web.dev.yml`](./web.dev.yml)

---

## What Each File Does

### `prometheus.prod.yml`

Production scrape config.

Current behavior:

- scrapes all platform services over HTTPS
- uses CA verification
- presents Prometheus client cert/key to mTLS-enabled targets
- loads alert rules from `/etc/prometheus/alerts.yml`

Current jobs:

- `gateway`
- `auth`
- `forum`
- `chat`
- `web`
- `postgres`

### `prometheus.dev.yml`

Development scrape config.

Current behavior:

- same job set as prod
- plain HTTP scraping
- no TLS or client cert config

This keeps the target list consistent while relaxing transport for local development.

### `alerts.yml`

Current Prometheus rule file.

The current rule set is intentionally availability-focused and uses scrape health plus `pg_up`.

### `web.prod.yml`

Prometheus web listener TLS config for production.

Current behavior:

- HTTPS enabled
- requires and verifies client certs

### `web.dev.yml`

Development Prometheus web config.

Current behavior:

- no TLS or mTLS

---

## Scrape Topology

### Production Targets

| Job | Target | Transport |
| --- | --- | --- |
| `gateway` | `gateway-service:8180` | HTTPS |
| `auth` | `auth-service:9000` | HTTPS |
| `forum` | `forum-service:8443` | HTTPS |
| `chat` | `chat-service:8443` | HTTPS |
| `web` | `web-service:3000` | HTTPS |
| `postgres` | `postgres-exporter-service:9187` | HTTPS |

Important details:

- `web` includes `server_name: web-service`
- `postgres` includes `server_name: postgres-exporter-service`

Those `server_name` values matter for correct certificate hostname verification.

### Development Targets

| Job | Target | Transport |
| --- | --- | --- |
| `gateway` | `gateway-service:8180` | HTTP |
| `auth` | `auth-service:9000` | HTTP |
| `forum` | `forum-service:8080` | HTTP |
| `chat` | `chat-service:8080` | HTTP |
| `web` | `web-service:3000` | HTTP |
| `postgres` | `postgres-exporter-service:9187` | HTTP |

---

## Alert Rules

Current alerts:

- `GatewayServiceDown`
- `AuthServiceDown`
- `ForumServiceDown`
- `ChatServiceDown`
- `WebServiceDown`
- `DatabaseDown`
- `PostgresExporterDown`

Current pattern:

- `up{job="..."}` for service scrape availability
- `pg_up == 0` for database availability
- `for: 5m`
- mostly `severity: critical`

So Prometheus currently answers:

- is the target scrapeable?
- is the database reachable according to the exporter?

It does not yet provide a broad degraded-state alert model.

---

## Web Security

### Production

[`web.prod.yml`](./web.prod.yml) config:

```yaml
tls_server_config:
  cert_file: /certs/prometheus.crt
  key_file: /certs/prometheus.key
  client_auth_type: RequireAndVerifyClientCert
  client_ca_file: /certs/internal-ca.crt
```

So Prometheus server access in prod is TLS-protected and client-cert-gated.

### Development

[`web.dev.yml`](./web.dev.yml) is intentionally empty/comment-only, meaning no web TLS/mTLS is enforced in dev.

---

## Compose Wiring

Mounted from:

- prod: [`docker-compose.yml`](../../../docker-compose.yml)
- dev: [`docker-compose.override.yml`](../../../docker-compose.override.yml)

Current mounts:

- Prometheus main config
- alert rules
- Prometheus web config

Current runtime args in prod also set:

- `--web.external-url=https://localhost/api/admin/prometheus/`
- `--web.route-prefix=/api/admin/prometheus/`

Those values keep Prometheus working correctly behind the gateway-admin prefix.

---

## Operational Notes

### 1. Prod and Dev Are Not Symmetric

A dev scrape succeeding does not prove the prod TLS config is correct.

### 2. Alert Rules Are Simple by Design

Do not assume Prometheus is currently alerting on:

- latency spikes
- gateway breaker behavior
- elevated error rates

Those are not in the rule file yet.

### 3. Route Prefix Matters

If gateway-admin browser paths change, Prometheus `external-url` / `route-prefix` may also need to change.

---

## Source of Truth

When updating Prometheus behavior, use these files first:

- [`prometheus.prod.yml`](./prometheus.prod.yml)
- [`prometheus.dev.yml`](./prometheus.dev.yml)
- [`alerts.yml`](./alerts.yml)
- [`web.prod.yml`](./web.prod.yml)
- [`web.dev.yml`](./web.dev.yml)
