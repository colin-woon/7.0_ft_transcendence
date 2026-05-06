# Auth Service

The auth service owns identity, sessions, and the user profile surface for the project. It is a Quarkus 3.30.5 application backed by PostgreSQL and isolated to the `auth_service` schema so authentication state stays separate from the forum and chat domains.

## What it does

- Handles password registration and login.
- Handles OIDC login for Google and 42.
- Issues and refreshes JWT-based sessions.
- Exposes profile reads and updates, including avatar management.
- Supports admin user maintenance and startup seeding.

## Data model

- `users` stores identity, profile, role, and status fields.
- `sessions` stores refresh-session records and device metadata.
- `intra` stores synced 42 profile data, including the original avatar URL used as a fallback.

## Avatar policy

Managed avatars are stored on disk as PNG files with a generated thumbnail. The service enforces a decoded-byte limit first, then validates the decoded image as a safety check against malformed or decompression-bomb inputs. The default cap is 1 MiB and can be overridden with `AVATAR_MAX_BYTES`.

If a remote avatar cannot be mirrored, the service falls back to keeping the remote URL instead of failing account sync.

## Runtime inputs

- `environment/auth.env` contains the default auth settings used by Docker Compose.
- `AVATAR_MAX_BYTES` controls the avatar upload limit in bytes.
- `SEED_MODE`, `SEED_FILE_PATH`, `SEED_TEST`, and the related seed variables control startup seeding.

## Deployment notes

- Docker Compose mounts `/var/lib/auth/avatars` for managed avatars.
- The auth entrypoint creates the avatar and seed directories and ensures the seed file exists.
- The health endpoint is exposed on the Quarkus management port.
