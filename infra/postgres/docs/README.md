# PostgreSQL Infra

This directory owns the shared PostgreSQL setup for the 42 Overflow stack.

It covers:

- bootstrap schema creation for all services
- the Compose-mounted database container
- the logical backup flow used for recovery

The project currently uses **one PostgreSQL instance** with **schema-level isolation** per service, not one database per service.

## What Lives Here

### Database container

`db-service` in [`docker-compose.yml`](../../docker-compose.yml) runs:

- image: `postgres:18.1-alpine`
- volume: `postgres_data:/var/lib/postgresql`
- init scripts: `./infra/postgres/init-scripts:/docker-entrypoint-initdb.d`
- env source: `./environment/db.env`
- healthcheck: `pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"`

This is the primary stateful data store for:

- `auth-service`
- `forum-service`
- `chat-service`

### Init scripts

[`init-scripts/schema.sql`](./init-scripts/schema.sql) is the current bootstrap source of truth.

It creates:

- schemas:
  - `auth_service`
  - `forum_service`
  - `chat_service`
- shared trigger function:
  - `update_updated_at_column()`
- service-owned tables, enums, indexes, and triggers

Important operational detail:

- files in `/docker-entrypoint-initdb.d` only run when PostgreSQL initializes a **fresh data volume**
- changing `schema.sql` does **not** migrate an already-initialized database

For existing volumes, schema changes must be applied manually or through a separate migration process.

## Schema Ownership

The current boundary is schema-based.

### `auth_service`

Owned by the Quarkus auth service.

Key tables:

- `users`
- `sessions`
- `intra`

Used for:

- local user identity and profile data
- OAuth-linked identity fields
- refresh-session persistence
- 42 profile snapshot data

### `forum_service`

Owned by the FastAPI forum service.

Key tables:

- `projects`
- `forum_posts`
- `comments`
- `post_votes`
- `comment_votes`
- `project_subscriptions`

Used for:

- project catalog
- forum threads and replies
- voting
- project subscription state

### `chat_service`

Owned by the Go chat service.

Key tables:

- `friendships`
- `rooms`
- `room_members`
- `messages`

Used for:

- friendship state
- direct/group chat room membership
- message history

`schema.sql` also enables `pgcrypto`, which chat currently uses for UUID generation.

## How Services Connect

The application code does not all connect the same way, but the target database is shared.

### Auth service

Auth uses JDBC and explicitly pins its schema in Quarkus config.

Relevant config:

- [`services/auth/src/main/resources/application.properties`](../../services/auth/src/main/resources/application.properties)

Current shape:

- JDBC URL points at `db-service:5432/postgres_db`
- schema is `auth_service`

### Forum service

Forum uses `DATABASE_URL` from container env.

Relevant file:

- [`services/forum/src/database.py`](../../services/forum/src/database.py)

The service now requires `DATABASE_URL` and no longer falls back to a hardcoded development DSN.

The SQLAlchemy models themselves declare `schema="forum_service"` where appropriate.

### Chat service

Chat builds its own connection string and uses `search_path` for schema targeting.

Relevant file:

- [`services/chat/internal/database/database.go`](../../services/chat/internal/database/database.go)

That means chat still talks to the same PostgreSQL instance, but operates inside the `chat_service` schema.

## Backups

Logical backups are handled by `db-backup-service` in Compose.

Current setup:

- image: `prodrigestivill/postgres-backup-local:18`
- source env: `./environment/db.env`
- host target: `db-service`
- schedule: `@daily`
- `BACKUP_ON_START=FALSE`
- retention:
  - `BACKUP_KEEP_DAYS=7`
  - `BACKUP_KEEP_WEEKS=4`
  - `BACKUP_KEEP_MONTHS=6`

Backups are written to:

- [`shared/backups/postgres`](../../shared/backups/postgres)

Typical output folders:

- `daily/`
- `weekly/`
- `monthly/`
- `last/`

The recovery flow is documented separately in:

- [`docs/disaster_recovery.md`](../../docs/disaster_recovery.md)

## Health and Operations

### Container health

`db-service` is considered healthy when:

- PostgreSQL accepts connections
- `pg_isready` succeeds against the configured database

Dependent services wait on that health state before booting.

### Backup health

`db-backup-service` exposes a small HTTP health surface and writes backup artifacts to disk.

That means the stack currently has:

- runtime database health via Compose and Prometheus
- backup-process health via the backup sidecar

### Observability

Database metrics are exported separately through:

- [`infra/obs/postgres-exporter`](../obs/postgres-exporter)

That component is documented in its own README and is not owned by this folder directly.

## Operational Notes

### Init scripts are not migrations

If you edit `schema.sql` after the volume already exists:

- PostgreSQL will **not** re-run it
- the running database will stay unchanged

If you need to apply a schema change, treat it as a migration task, not as a Compose restart task.

### One database, multiple schemas

The service boundary is logical, not physical.

That is fine for this project, but it means:

- backup and restore operate on the whole application database
- one database incident affects all stateful services together

### Backup is for recovery, not HA

`db-backup-service` gives you logical restore points.
It does **not** provide:

- replication
- automatic failover
- point-in-time recovery

This setup is recovery-oriented, not highly available.

### Volume recreation will re-run bootstrap

If `postgres_data` is removed and the database starts fresh:

- the entrypoint scripts run again
- schemas/tables are recreated from `schema.sql`

That is useful for local rebuilds, but it is destructive if done carelessly.

## Related Files

- [`docker-compose.yml`](../../docker-compose.yml)
- [`init-scripts/schema.sql`](./init-scripts/schema.sql)
- [`docs/disaster_recovery.md`](../../docs/disaster_recovery.md)
- [`infra/obs/postgres-exporter/README.md`](../obs/postgres-exporter/README.md)
