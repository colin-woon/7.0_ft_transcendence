# Observability Stack

This directory contains the platform observability configuration for:

- Prometheus
- Grafana
- postgres-exporter

Current structure:

```text
infra/obs/
├── grafana/
│   ├── dashboards/
│   └── provisioning/
├── postgres-exporter/
└── prometheus/
```

This stack is mounted directly by Compose and should be treated as configuration-as-code for metrics, dashboards, and alert rules.

---

## What Lives Here

### Prometheus

Directory:

- [`infra/obs/prometheus`](./prometheus)

Contains:

- scrape configuration for dev and prod
- alert rules
- Prometheus web TLS config

Files:

- [`prometheus.prod.yml`](./prometheus/prometheus.prod.yml)
- [`prometheus.dev.yml`](./prometheus/prometheus.dev.yml)
- [`alerts.yml`](./prometheus/alerts.yml)
- [`web.prod.yml`](./prometheus/web.prod.yml)
- [`web.dev.yml`](./prometheus/web.dev.yml)

### Grafana

Directory:

- [`infra/obs/grafana`](./grafana)

Contains:

- provisioned datasource config
- provisioned dashboard provider config
- dashboard JSON files stored in the repo

Files:

- [`dashboards/42Overflow.json`](./grafana/dashboards/42Overflow.json)
- [`provisioning/datasources/prometheus.prod.yml`](./grafana/provisioning/datasources/prometheus.prod.yml)
- [`provisioning/datasources/prometheus.dev.yml`](./grafana/provisioning/datasources/prometheus.dev.yml)
- [`provisioning/dashboards/dashboards.yml`](./grafana/provisioning/dashboards/dashboards.yml)

### postgres-exporter

Directory:

- [`infra/obs/postgres-exporter`](./postgres-exporter)

Contains:

- exporter web TLS config for prod
- relaxed dev config

Files:

- [`web.prod.yml`](./postgres-exporter/web.prod.yml)
- [`web.dev.yml`](./postgres-exporter/web.dev.yml)

---

## Runtime Topology

### Production

Production uses:

- Prometheus over HTTPS with mutual TLS
- postgres-exporter over HTTPS with mutual TLS
- Grafana over HTTPS
- Grafana datasource access to Prometheus over HTTPS with mutual TLS
- gateway-admin access for browser-facing observability routes

Mounted from:

- [`docker-compose.yml`](../../docker-compose.yml)

Key mounts:

- Prometheus config and alerts
- Prometheus web TLS config
- Grafana provisioning and dashboards
- postgres-exporter web TLS config

### Development

Development uses:

- plain HTTP between observability components
- same alert rules
- a lighter datasource/web config

Mounted from:

- [`docker-compose.override.yml`](../../docker-compose.override.yml)

This keeps the observability surface usable locally without requiring full internal TLS for every component.

---

## Prometheus

### Scrape Topology

Current jobs in both dev and prod:

- `gateway`
- `auth`
- `forum`
- `chat`
- `web`
- `postgres`

### Production Scrapes

[`prometheus.prod.yml`](./prometheus/prometheus.prod.yml) uses:

- `scheme: https`
- `tls_config`
- CA verification
- Prometheus client certificate/key for scrapes

Production targets:

- `gateway-service:8180`
- `auth-service:9000`
- `forum-service:8443`
- `chat-service:8443`
- `web-service:3000`
- `postgres-exporter-service:9187`

Important detail:

- web and postgres exporter include explicit `server_name` values in TLS config
- this is needed for correct certificate hostname verification

### Development Scrapes

[`prometheus.dev.yml`](./prometheus/prometheus.dev.yml) uses plain HTTP and development ports:

- `gateway-service:8180`
- `auth-service:9000`
- `forum-service:8080`
- `chat-service:8080`
- `web-service:3000`
- `postgres-exporter-service:9187`

No TLS config is applied in dev.

---

## Alert Rules

Current alert rules live in:

- [`infra/obs/prometheus/alerts.yml`](./prometheus/alerts.yml)

Right now the rule set is intentionally simple and availability-focused.

Current alerts:

- `GatewayServiceDown`
- `AuthServiceDown`
- `ForumServiceDown`
- `ChatServiceDown`
- `WebServiceDown`
- `DatabaseDown`
- `PostgresExporterDown`

Each service-down alert is based on Prometheus scrape health:

```promql
up{job="..."} == 0
```

and uses:

- `for: 5m`
- `severity: critical`

So current alerting is:

- strong on hard outages
- light on degraded-state detection

That matches the current project scope and dashboard work.

---

## Prometheus Web Security

Prometheus web config files:

- prod: [`web.prod.yml`](./prometheus/web.prod.yml)
- dev: [`web.dev.yml`](./prometheus/web.dev.yml)

### Production

Prometheus web access is protected with TLS + client certificate verification:

```yaml
tls_server_config:
  cert_file: /certs/prometheus.crt
  key_file: /certs/prometheus.key
  client_auth_type: RequireAndVerifyClientCert
  client_ca_file: /certs/internal-ca.crt
```

So Prometheus is not exposed as plain unauthenticated HTTP in production.

### Development

`web.dev.yml` intentionally disables this and leaves a comment-only file:

- no Prometheus web TLS/mTLS in dev

---

## Grafana

### Datasource Provisioning

Grafana’s Prometheus datasource is provisioned from file.

Prod:

- [`prometheus.prod.yml`](./grafana/provisioning/datasources/prometheus.prod.yml)

Dev:

- [`prometheus.dev.yml`](./grafana/provisioning/datasources/prometheus.dev.yml)

### Production Datasource

The prod datasource uses:

- `url: https://prometheus-service:9090/api/admin/prometheus/`
- CA cert
- client cert
- client key
- `serverName: prometheus-service`

So Grafana reaches Prometheus with mutual TLS for datasource access in production.

### Development Datasource

The dev datasource is intentionally simpler:

- `url: http://prometheus-service:9090/api/admin/prometheus/`
- no TLS client config

### Dashboard Provisioning

Dashboard provider config:

- [`provisioning/dashboards/dashboards.yml`](./grafana/provisioning/dashboards/dashboards.yml)

Current behavior:

- reads dashboard JSON from `/etc/grafana/dashboards`
- updates every 10 seconds
- `allowUiUpdates: true`

This means:

- repo JSON files are the baseline source of truth
- UI edits are possible
- if you want dashboards to survive volume resets, export them back into `infra/obs/grafana/dashboards`

Current dashboard file in repo:

- [`42Overflow.json`](./grafana/dashboards/42Overflow.json)

---

## postgres-exporter

### Production

[`postgres-exporter/web.prod.yml`](./postgres-exporter/web.prod.yml) enables:

- TLS server cert/key
- required and verified client certs

So Prometheus scrapes postgres-exporter over mTLS in production.

### Development

[`postgres-exporter/web.dev.yml`](./postgres-exporter/web.dev.yml) is effectively empty:

```yaml
{}
```

So dev exporter access is plain and intentionally relaxed.

---

## Compose Wiring

The observability stack is wired in Compose from:

- [`docker-compose.yml`](../../docker-compose.yml)
- [`docker-compose.override.yml`](../../docker-compose.override.yml)

Current service names:

- `prometheus-service`
- `grafana-service`
- `postgres-exporter-service`

Important mounts:

- Prometheus config, alerts, and web config
- Grafana datasource and dashboard provisioning
- dashboard JSON files
- exporter web config

Browser-facing observability access is routed through the gateway admin surface:

- `/api/admin/grafana/`
- `/api/admin/prometheus/`

Those routes are intended for authenticated admin use rather than direct public edge exposure.

---

## Operational Notes

### 1. Dashboard UI Changes Are Not the Repo Source of Truth

Grafana can be edited in the UI, but those changes do not become durable infra config unless the dashboard is exported back into:

- `infra/obs/grafana/dashboards/*.json`

### 2. Dev and Prod Security Posture Are Intentionally Different

Prod uses HTTPS/mTLS heavily across Prometheus, exporter, and Grafana datasource access.

Dev does not.

Do not assume a dev scrape or datasource success proves the prod TLS config is correct.

### 3. Alerting is currently availability-focused

The current rule set catches:

- service-down
- database-down
- exporter-down

It does not yet fully cover degraded states like:

- high error rate
- circuit breaker fast-fail
- elevated latency

Those alert classes are not part of the current rule set.

### 4. Browser Access Is Gateway-Gated

Prometheus and Grafana are intended to be accessed through the gateway admin surface rather than direct public edge routes.

---

## Source of Truth

When updating observability docs, use these as the canonical source:

- [`prometheus/*.yml`](./prometheus)
- [`grafana/provisioning/*.yml`](./grafana/provisioning)
- [`grafana/dashboards/*.json`](./grafana/dashboards)
- [`postgres-exporter/*.yml`](./postgres-exporter)
- [`docker-compose.yml`](../../docker-compose.yml)
- [`docker-compose.override.yml`](../../docker-compose.override.yml)

These files define the actual observability runtime behavior.
