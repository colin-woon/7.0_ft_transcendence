# Auth Service

The auth service is the identity and profile authority for the platform. It is a Quarkus 3.30.5 service backed by PostgreSQL (`auth_service` schema), and it serves both token/session flows and profile/admin endpoints consumed by the web frontend through the gateway.

## Responsibilities

- Password registration and login.
- OIDC login with Google and 42.
- OIDC account linking for already logged-in users.
- Access-token issuance (JWT) and refresh-session management.
- Profile read/update/delete, avatar management, and 42 data reload.
- Admin user lifecycle actions.
- Startup seeding (file/campus/logins modes).

## Identity and Data Model

- `auth_service.users`
	- `overflow_email`: canonical local email for password and local account flows.
	- `google_email`, `intra_email`: provider email snapshots for link/login reconciliation.
	- `google_id`, `intra_id`: provider subject identifiers.
	- Profile and authorization fields (`username`, `full_name`, `role`, `is_banned`, etc.).
- `auth_service.sessions`
	- Refresh-session table keyed by `session_id`.
	- Stores user agent metadata and expiry.
- `auth_service.intra`
	- Cached/compact 42 profile payload used by profile UI and search summaries.

## Auth Flows

### 1) OIDC login flow (`/api/public/auth/login/{provider}`)

1. Browser navigates to provider login endpoint (`google` or `42`).
2. Quarkus OIDC redirects to provider and receives callback.
3. OIDC restores path and re-enters login endpoint with authenticated OIDC identity.
4. Service syncs/creates user (`UserService.syncUser`).
5. Service issues:
	 - `sessionId` cookie (refresh-session identifier).
	 - `accessToken` cookie.
	 - response payload with `accessToken`, `expiresIn`, and `user`.
6. Service clears Quarkus OIDC transient cookies and redirects to `/profile`.

### 2) OIDC link flow (`/api/public/auth/link/{provider}`)

1. Logged-in user starts link from settings.
2. Browser navigates to link endpoint.
3. Service validates current `sessionId` owner.
4. Service links provider identity to that same user (`UserService.linkProvider`).
5. Service issues new access token, clears OIDC transient cookies, redirects to `/profile`.
6. On link errors, service redirects with `?error=...` to `/settings` or `/login` depending on failure type.

### 3) Password flow (`/auth/password/*` via public gateway route)

- Register: validates input, creates user with `overflow_email`, hashes password with Argon2.
- Login: validates credentials with constant-time fallback path and issues session/access token.

### 4) Refresh flow (`POST /auth/refresh` via public route)

- Requires `sessionId` cookie.
- Validates session and user status.
- Returns fresh access token + user payload.

## Cookies and Tokens

- `sessionId` (HttpOnly, Secure in non-dev, SameSite=Lax): refresh-session handle.
- `accessToken` (HttpOnly, Secure in non-dev, SameSite=Lax): JWT for gateway-authenticated calls.
- OIDC temporary cookies (`q_session*`) are cleared after login/link completion.

JWT claims include:

- `sub`: local user id.
- `upn`: `overflow_email`.
- `groups`: role set (`STUDENT` / `ADMIN`).

## Endpoint Surface

- Public auth routes (through gateway `/api/public/...`):
	- `GET /auth/login/{provider}`
	- `GET /auth/callback/{provider}`
	- `GET /auth/link/{provider}`
	- `POST /auth/password/login`
	- `POST /auth/password/register`
	- `POST /auth/refresh`
- Protected auth routes:
	- `POST /auth/logout`, `POST /auth/logout/all`, `GET /auth/sessions`
	- `GET/PATCH /auth/me`, `POST /auth/me/password`, `DELETE /auth/delete`
	- `GET /auth/users`, `GET /auth/users/{id}`
	- `POST /auth/reload`
	- `PATCH /auth/admin/users/{id}`
	- `POST /auth/admin/users/{id}/logout`
	- `POST /auth/admin/users/create`
	- `DELETE /auth/admin/users/{id}/delete`

## Error and Redirect Contract

- Login/link OIDC routes redirect to frontend pages.
- Redirect errors are sent as `?error=<message>` query params.
- Typical statuses:
	- `401`: invalid/expired session, missing auth context.
	- `403`: banned or unauthorized action.
	- `404`: user not found for an existing session/link target.
	- `409`: identity/link conflicts.

## Frontend Integration Summary

- Web client starts OIDC with:
	- `window.location = /api/public/auth/login/{provider}`
	- `window.location = /api/public/auth/link/{provider}`
- After redirect completion, profile/settings pages rely on refresh/session restoration and then call protected APIs with bearer token + cookies.
- Settings page controls linking state using `linkedWithGoogle` / `linkedWithIntra` from `UserInfoDTO`.

## Avatar and Intra Sync Notes

- Avatar uploads are decoded, size-checked, image-validated, and stored with thumbnail variants.
- For OIDC/provider avatars, remote image mirroring is attempted; failures fall back to remote URL.
- 42 data can be refreshed via `/auth/reload` for linked users.

## Runtime Inputs

- `AVATAR_MAX_BYTES`: avatar size cap.
- `SECURE_COOKIES`, `MAX_SESSIONS_PER_USER`: cookie/session behavior.
- `ACCESS_EXPIRY`, `REFRESH_EXPIRY`: token/session durations.
- `auth.password.argon2.*`: password hashing cost parameters.
- `SEED_*`: startup seeding controls.

## Deployment Notes

- Compose mounts:
	- `/var/lib/auth/avatars`
	- `/var/lib/auth/seed`
- Auth entrypoint ensures required writable directories exist.
- Health is exposed on management port (`/q/health`).
