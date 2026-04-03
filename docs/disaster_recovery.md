# Disaster Recovery Runbook

## Purpose

This runbook covers database recovery for the 42 Overflow stack when a transient restart is no longer enough and PostgreSQL data must be restored from backup.

It supports two cases:
- logical restore into a running `db-service`
- volume-recreation followed by restore into a freshly started `db-service`

Use this when:
- `db-service` stays unhealthy after repeated restart attempts
- PostgreSQL reports corruption or missing data files
- critical application data is lost or the database volume must be recreated

Do not use this for a short-lived outage where `db-service` restarts cleanly and dependent services recover on their own.

## Backup Source

Automated backups are written by `db-backup-service` to:

- `shared/backups/postgres/daily/`
- `shared/backups/postgres/weekly/`
- `shared/backups/postgres/monthly/`
- `shared/backups/postgres/last/`

The quickest restore target is usually:

- `shared/backups/postgres/last/postgres_db-latest.sql.gz`

## Recovery Flow

### 1. Stop write traffic

Stop services that can write to PostgreSQL before restoring:

```bash
docker compose stop nginx-service gateway-service auth-service forum-service chat-service web-service db-backup-service
```

`db-service` should remain running for the restore command unless the container itself is broken.

### 2. Decide the recovery path

Use one of these paths before restoring:

- Path A: `db-service` is still running and accepts `psql`
  - continue to the backup-selection step
- Path B: the PostgreSQL data volume is corrupted, missing, or must be recreated
  - remove and recreate the database container/volume first, then continue

For the volume-recreation path:

```bash
docker compose stop db-service
docker compose rm -f db-service
docker volume rm bumintra_postgres_data
docker compose up -d db-service
```

After `db-service` comes back, confirm it is reachable before continuing:

```bash
docker compose exec db-service sh -lc 'pg_isready -U "$POSTGRES_USER" -d postgres'
```

### 3. Pick the backup file

Inspect the available dumps:

```bash
ls -lah shared/backups/postgres/last
ls -lah shared/backups/postgres/daily
```

Choose the dump to restore. In most cases:

```text
shared/backups/postgres/last/postgres_db-latest.sql.gz
```

### 4. Recreate the target database

Drop and recreate the application database inside `db-service`:

```bash
docker compose exec db-service sh -lc 'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\";"'
docker compose exec db-service sh -lc 'psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"'
```

### 5. Restore the dump

Restore the chosen backup into the recreated database:

```bash
gunzip -c shared/backups/postgres/last/postgres_db-latest.sql.gz | docker compose exec -T db-service sh -lc 'psql -v ON_ERROR_STOP=on -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

If you are restoring a different dump, replace the file path on the left side of the pipe.

### 6. Start the stack again

Bring the stopped services back:

```bash
docker compose start db-backup-service auth-service forum-service chat-service web-service gateway-service nginx-service
```

## Verification

After restore, verify:

1. `db-service` is healthy.
2. `auth-service`, `forum-service`, `chat-service`, `web-service`, `gateway-service`, and `nginx-service` return to healthy state.
3. The expected application data is present.
4. `db-backup-service` resumes normally.

Useful checks:

```bash
docker compose ps
docker logs postgres-db --tail 100
docker logs postgres-backup-service --tail 100
```

## Notes

- Restart policy handles transient failures. This runbook is for persistent failures or data loss.
- Compose healthchecks and Prometheus/Grafana alerts should be used to decide when the incident has crossed from transient outage into disaster recovery.
- Restore should be followed by an application sanity check, not only container-health confirmation.
