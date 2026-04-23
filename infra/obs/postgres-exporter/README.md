# postgres-exporter

This folder contains the web security config for `postgres-exporter`.

Files:

- [`web.prod.yml`](./web.prod.yml)
- [`web.dev.yml`](./web.dev.yml)

The exporter itself is wired from Compose, while this folder controls how its HTTP endpoint is exposed in dev vs prod.

---

## Purpose

`postgres-exporter` exposes PostgreSQL health and metrics for Prometheus scraping.

In this stack it supports:

- `pg_up`
- database-level metrics for availability/monitoring

Prometheus scrapes it under the `postgres` job.

---

## Production Behavior

[`web.prod.yml`](./web.prod.yml) enables:

```yaml
tls_server_config:
  cert_file: /certs/postgres-exporter.crt
  key_file: /certs/postgres-exporter.key
  client_auth_type: RequireAndVerifyClientCert
  client_ca_file: /certs/internal-ca.crt
```

So in production:

- exporter serves HTTPS
- client certificates are required
- Prometheus must present a valid client cert signed by the internal CA

This keeps exporter metrics inside the internal trust boundary.

---

## Development Behavior

[`web.dev.yml`](./web.dev.yml) is:

```yaml
{}
```

So in development:

- exporter web TLS is effectively disabled
- Prometheus scrapes it over plain HTTP

This is intentionally relaxed for local convenience.

---

## Compose Wiring

Mounted from:

- prod: [`docker-compose.yml`](../../../docker-compose.yml)
- dev: [`docker-compose.override.yml`](../../../docker-compose.override.yml)

Current service:

- `postgres-exporter-service`

Current scrape target from Prometheus:

- `postgres-exporter-service:9187`

Production also mounts:

- exporter cert
- exporter key

Development does not need those for the exporter web endpoint.

---

## Operational Notes

### What Prometheus Uses It For

Prometheus uses postgres-exporter for:

- scrape availability of the exporter itself
- database availability via `pg_up`

Current alert rules tied to this path:

- `DatabaseDown`
- `PostgresExporterDown`

### What It Does Not Do

This exporter is not a backup system, failover system, or database access proxy. It is only an observability component.

---

## Current Footguns

### 1. Dev Success Does Not Prove Prod TLS Is Correct

Dev exporter access is plain. Prod exporter access is TLS + client-cert verified.

### 2. `DatabaseDown` Depends On Exporter Health Too

If exporter itself is broken, Prometheus may lose both:

- `up{job="postgres"}`
- fresh `pg_up`

So database visibility depends on exporter availability.

---

## Source of Truth

Use these files when changing exporter observability behavior:

- [`web.prod.yml`](./web.prod.yml)
- [`web.dev.yml`](./web.dev.yml)
- [`../../docker-compose.yml`](../../../docker-compose.yml)
- [`../../docker-compose.override.yml`](../../../docker-compose.override.yml)
- [`../prometheus/prometheus.prod.yml`](../prometheus/prometheus.prod.yml)
- [`../prometheus/prometheus.dev.yml`](../prometheus/prometheus.dev.yml)
