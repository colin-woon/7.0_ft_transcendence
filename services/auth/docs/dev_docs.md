# Auth Service Developer Notes

This document explains how the auth service is wired in development and what to check when changing it.

## Local run model

The service is usually started through Docker Compose. In dev mode, the override file mounts the auth source tree into the container and exposes the Quarkus dev HTTP port plus the management health port.

The production image uses the custom auth entrypoint to prepare writable runtime paths before Quarkus starts.

## Configuration surface

- `AVATAR_MAX_BYTES` is the main avatar upload limit and defaults to `1048576` bytes.
- `AUTH_SEED_FILE_PATH` can override the seed file location used by the entrypoint.
- `SEED_MODE` controls whether startup seeding is skipped or loaded from file, logins, or campus data.
- `SECURE_COOKIES` and `MAX_SESSIONS_PER_USER` control cookie behavior and per-user session limits.

Keep the auth web validation aligned with the backend avatar limit. The frontend currently uses the same byte cap in `services/web/src/features/auth/utils/avatarFile.ts`.

## Avatar lifecycle

1. The frontend converts the selected file to a data URL.
2. The backend decodes the payload and rejects it if the decoded size exceeds the configured byte limit.
3. The service validates the image and stores both the full PNG and a thumbnail.
4. When an avatar is cleared, managed files are deleted and the profile reverts to no managed avatar.

The dimension check is a secondary safety guard, not the primary policy gate.

## Seed modes

- `off`: no startup seeding.
- `file`: load `/var/lib/auth/seed/seed_file.json` or the configured seed file.
- `logins`: fetch specific 42 logins.
- `campus`: fetch all users in the configured campus list.

The entrypoint creates the seed file when missing so file mode does not fail on a fresh volume.

## Troubleshooting

- A `413` during avatar upload usually means the payload exceeds `AVATAR_MAX_BYTES`.
- A `403` from profile APIs usually means the user is banned.
- If the health check fails in Compose, verify the management port certificate mounts and the startup seed phase has finished.
