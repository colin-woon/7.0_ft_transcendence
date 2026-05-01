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

This runbook targets the production Compose topology:

```bash
docker compose -f docker-compose.yml --env-file ./environment/shared.env ...
```

Do not rely on bare `docker compose ...` in this repository during recovery, because `docker-compose.override.yml` may be picked up implicitly and change service behavior.

## Backup Source

Automated backups are written by `db-backup-service` to:

- `shared/backups/postgres/daily/`
- `shared/backups/postgres/weekly/`
- `shared/backups/postgres/monthly/`
- `shared/backups/postgres/last/`

The quickest restore target is usually:

- `shared/backups/postgres/last/postgres_db-latest.sql.gz`

`db-backup-service` does not take a backup automatically on container start. This avoids replacing the `last/` snapshot with a freshly booted empty or partially recovered database during a restore drill.

## Recovery Flow

### 1. Stop write traffic

Stop services that may create or observe database activity before restoring:

```bash
make dr-stop-services
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
make dr-recreate-db
```

The default database volume for the current project name is `42overflow_postgres_data`.

If your local volume name differs, override it when running the target:

```bash
make dr-recreate-db DR_DB_VOLUME=<actual-volume-name>
```

After `db-service` comes back, confirm it is reachable before continuing:

```bash
make dr-db-ready
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

If the most recent `last/` snapshot is not the one you want, restore from `daily/`, `weekly/`, or `monthly/` instead.

### 4. Recreate the target database

Drop and recreate the application database inside `db-service`:

```bash
make dr-reset-db
```

### 5. Restore the dump

Restore the chosen backup into the recreated database:

```bash
make dr-restore-last
```

If you are restoring a different dump, override the backup path:

```bash
make dr-restore-last DR_BACKUP_FILE=./shared/backups/postgres/daily/<backup-file>.sql.gz
```

### 6. Start the stack again

Bring the stopped services back:

```bash
make dr-start-services
```

## Verification

After restore, verify:

1. `db-service` is healthy.
2. `auth-service`, `forum-service`, `chat-service`, `web-service`, `gateway-service`, and `nginx-service` return to healthy state.
3. The expected application data is present.
4. `db-backup-service` resumes normally.

Useful checks:

```bash
make ps
docker logs postgres-db --tail 100
docker logs postgres-backup-service --tail 100
```

## Notes

- Restart policy handles transient failures. This runbook is for persistent failures or data loss.
- Compose healthchecks and Prometheus/Grafana alerts should be used to decide when the incident has crossed from transient outage into disaster recovery.
- Restore should be followed by an application sanity check, not only container-health confirmation.
