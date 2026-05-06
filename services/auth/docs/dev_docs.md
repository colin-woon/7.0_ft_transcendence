# Auth Service Developer Notes

This document focuses on implementation-level behavior for auth flows, integration points, and common maintenance tasks.

## Runtime Topology

- The service runs behind gateway and nginx in Docker Compose.
- Public entrypoints are proxied via gateway `/api/public/...` routes.
- Protected APIs are exposed under `/api/auth/...` and require a valid JWT (plus session for refresh/logout semantics).
- In dev, compose override can mount sources for live reload.

## Auth Architecture

The service uses a two-token model:

- Access token: short-lived JWT used for authorization.
- Refresh session: long-lived `sessionId` cookie backed by `auth_service.sessions`.

For OIDC, Quarkus handles provider redirects and callback code exchange. The app logic runs on restored login/link paths.

## OIDC Login and Link Details

### Login (`GET /api/public/auth/login/{provider}`)

- Expected providers: `google`, `42`.
- Flow:
	1. OIDC auth challenge/redirect.
	2. Callback processing by Quarkus.
	3. User sync/create in `UserService.syncUser`.
	4. Session + access token issuance.
	5. Redirect to `/profile`.

### Link (`GET /api/public/auth/link/{provider}`)

- Requires an existing valid `sessionId` cookie.
- Flow:
	1. Validate session ownership (`AuthService.validateSessionUser`).
	2. Link provider identity to target user (`UserService.linkProvider`).
	3. Return refreshed access token and redirect to `/profile`.

### Redirect error behavior

- Login/link routes redirect with `?error=<message>` on failures.
- Login/settings pages should render these route errors explicitly.

## Password and Session Semantics

- Password hashing: Argon2id via `PasswordService`.
- Argon2 tuning keys:
	- `auth.password.argon2.iterations`
	- `auth.password.argon2.memory-kb`
	- `auth.password.argon2.parallelism`
- Refresh path (`POST /auth/refresh`) validates `sessionId` and user status.
- Session-cap behavior (`MAX_SESSIONS_PER_USER`) deletes oldest session when limit is reached.

## User Identity Reconciliation

The model supports:

- `overflow_email`: local canonical email.
- `google_email` / `intra_email`: provider emails.
- `google_id` / `intra_id`: provider account ids.

For login/link safety, provider id and provider email must never resolve to different local users. Treat this as a hard `409` conflict.

## Profile and Admin Surface

- User profile:
	- `GET /auth/me`
	- `PATCH /auth/me`
	- `POST /auth/me/password`
	- `DELETE /auth/delete`
- Sessions:
	- `GET /auth/sessions`
	- `POST /auth/logout`
	- `POST /auth/logout/all`
- Admin:
	- `PATCH /auth/admin/users/{id}`
	- `POST /auth/admin/users/{id}/logout`
	- `POST /auth/admin/users/create`
	- `DELETE /auth/admin/users/{id}/delete`

Role enforcement is done server-side (`@RolesAllowed("ADMIN")`) and additional checks prevent admins from modifying/deleting other admins.

## Frontend Contract

Web module integration points:

- Start OIDC login: `/api/public/auth/login/{provider}`.
- Start OIDC link: `/api/public/auth/link/{provider}`.
- Restore auth state: `/api/public/auth/refresh` with cookies.
- Use bearer + cookies for protected `/api/auth/*` calls.

Frontend should treat route query error (`?error=`) as displayable user feedback for login/link failures.

## Avatar Lifecycle

1. Frontend converts uploaded image to data URL.
2. Backend enforces decoded byte cap (`AVATAR_MAX_BYTES`).
3. Backend validates image and stores full PNG + thumbnail.
4. Clearing avatar deletes managed files.
5. Remote provider avatars are mirrored when possible; fallback keeps remote URL.

## Seed Modes

- `off`: skip seeding.
- `file`: load configured seed file path.
- `logins`: fetch selected 42 users by login.
- `campus`: fetch selected campus users.

Optional admin bootstrap is controlled by `SEED_ADMIN_*` settings.

## Operational Checklist

- When touching OIDC flows, test:
	- login success/failure for both providers.
	- link success/conflict/session-expired paths.
	- redirect error display in login/settings UI.
- When touching DTO fields, verify web auth types are updated in `services/web/src/features/auth/api/authService.ts`.
- When touching password logic, verify Argon2 parameters remain valid and login still supports existing stored hashes.

## Troubleshooting

- `401` on refresh: missing/expired `sessionId`.
- `403` on profile/auth calls: banned user or forbidden operation.
- `409` on login/link: provider identity conflict.
- Startup health delays in seeding modes are expected; adjust compose health start periods accordingly.
