# Grafana

This folder contains provisioned Grafana dashboards and datasource configuration.

Structure:

```text
grafana/
├── dashboards/
│   └── 42Overflow.json
└── provisioning/
    ├── dashboards/
    │   └── dashboards.yml
    └── datasources/
        ├── prometheus.dev.yml
        └── prometheus.prod.yml
```

---

## What Each Part Does

### `dashboards/`

Repo-stored dashboard JSON files.

Current dashboard:

- [`42Overflow.json`](./dashboards/42Overflow.json)

If you want a dashboard to survive volume resets or container recreation, it needs to exist here.

### `provisioning/datasources/`

Prometheus datasource definitions for:

- prod
- dev

These are mounted into Grafana provisioning and loaded automatically at startup.

### `provisioning/dashboards/dashboards.yml`

Dashboard provider config.

Current behavior:

- loads dashboard JSON from `/etc/grafana/dashboards`
- polls for changes every 10 seconds
- allows UI updates

---

## Datasource Behavior

### Production Datasource

[`prometheus.prod.yml`](./provisioning/datasources/prometheus.prod.yml) config:

- datasource name: `Prometheus`
- uid: `prometheus`
- URL: `https://prometheus-service:9090/prometheus/`
- `tlsAuth: true`
- `tlsAuthWithCACert: true`
- `serverName: prometheus-service`
- embedded CA cert
- embedded client cert
- embedded client key

So in prod, Grafana reaches Prometheus over TLS with client authentication.

### Development Datasource

[`prometheus.dev.yml`](./provisioning/datasources/prometheus.dev.yml) config:

- same datasource name and uid
- URL: `http://prometheus-service:9090`
- no TLS client config

So the datasource shape stays stable while transport security is relaxed in dev.

---

## Dashboard Provisioning

[`dashboards.yml`](./provisioning/dashboards/dashboards.yml) currently defines one file-based provider:

- provider name: `42-overflow-dashboards`
- folder: root folder
- `disableDeletion: false`
- `updateIntervalSeconds: 10`
- `allowUiUpdates: true`

What that means in practice:

- dashboard JSON in the repo is automatically loaded
- Grafana UI edits are allowed
- UI edits are not durable infra config unless exported back into `dashboards/*.json`

The repo JSON should still be treated as the durable source of truth.

---

## Compose Wiring

Mounted from:

- prod: [`docker-compose.yml`](../../../docker-compose.yml)
- dev: [`docker-compose.override.yml`](../../../docker-compose.override.yml)

Current mounts:

- datasource provisioning
- dashboard provider provisioning
- dashboard JSON files

Current Grafana service behavior:

- prod serves HTTPS and is exposed by nginx under `/grafana/`
- dev serves plain HTTP internally, while nginx still exposes it through the main browser-facing TLS entrypoint

In prod, Compose also sets:

- `GF_SERVER_ROOT_URL=https://localhost/grafana/`

So Grafana is configured to operate behind the nginx subpath.

---

## Working With Dashboards

Recommended workflow:

1. edit or create dashboards in Grafana UI
2. export the final JSON
3. save it into `infra/obs/grafana/dashboards/`
4. keep the repo file as the durable version

This avoids losing dashboards when:

- Grafana volumes are reset
- containers are recreated
- provisioning state is rebuilt

---

## Current Footguns

### 1. UI Changes Alone Are Not Durable

If a dashboard only exists in the Grafana volume and not in `dashboards/*.json`, it is not durable infra config.

### 2. Datasource Security Differs by Environment

Prod datasource config includes embedded TLS material and server-name verification.

Dev does not.

Do not debug a prod datasource issue by assuming the dev datasource path is equivalent.

### 3. Subpath Routing Matters

Grafana is intended to sit behind:

- `/grafana/`

If nginx route prefixes change, Grafana `root_url` and forwarded prefix behavior may need to change too.

---

## Source of Truth

Use these files as the canonical Grafana config:

- [`dashboards/*.json`](./dashboards)
- [`provisioning/datasources/*.yml`](./provisioning/datasources)
- [`provisioning/dashboards/dashboards.yml`](./provisioning/dashboards/dashboards.yml)
