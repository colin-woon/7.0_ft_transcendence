# Auth Service

Authentication and user management microservice for ft_transcendence, built with Quarkus.

## Overview

The Auth Service handles OAuth authentication (Google, 42 Intra), JWT token management, user profiles, and session management. It provides a secure authentication layer for the entire application.

## Features

- **OAuth 2.0 / OIDC Authentication**
  - Google OAuth integration
  - 42 Intra OAuth (ready for implementation)
  - Multi-tenant OIDC configuration

- **JWT Token Management**
  - Access tokens (10 minutes default)
  - Refresh tokens via secure HTTP-only cookies (24 hours default)
  - RS256 signature algorithm
  - Custom JWT signing and validation

- **User Management**
  - User registration via OAuth providers
  - Profile management (username, full name, avatar, bio)
  - User search functionality
  - Role-based access control (STUDENT, ADMIN)
  - Account linking (multiple OAuth providers per user)

- **Session Management**
  - Secure session cookies
  - Session-based refresh token mechanism
  - Session expiration and cleanup

## Tech Stack

- **Framework**: Quarkus 3.30.5
- **Language**: Java 21  
- **Database**: PostgreSQL (via Hibernate ORM + Panache)
- **Authentication**: Quarkus OIDC + SmallRye JWT
- **Build Tool**: Maven

## Quick Start

### Prerequisites

- Java 21 (via SDKMAN - see [DEV_DOC.md](DEV_DOC.md))
- Docker & Docker Compose
- PostgreSQL database

### Running in Development

From the project root:

```bash
# Start auth service with database
make auth
```

Or directly from the auth service directory:

```bash
./mvnw quarkus:dev
```

The service will be available at:
- **API**: `http://localhost:8002`
- **Dev UI**: `http://localhost:8002/q/dev`

### Environment Variables

Create or configure `environment/shared.env`:

```env
# Domain
DOMAIN_NAME=localhost
PUBLIC_PORT=8002

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Just set a dummy for now, 42 OAuth has not been implemented yet
FT_CLIENT_ID=your_42_client_id
FT_CLIENT_SECRET=your_42_client_secret

# Database
DB_USER=dev_user
DB_PASSWORD=dev_password

# JWT
ACCESS_EXPIRY=600        # 10 minutes
REFRESH_EXPIRY=86400     # 24 hours
```

## API Endpoints

### Authentication

- `GET /auth/login/{provider}` - Initiate OAuth login (google)
- `POST /auth/refresh` - Refresh access token using session cookie
- `POST /auth/logout` - Logout and invalidate session
- `DELETE /auth/delete` - Delete user account

### User Profile

- `GET /auth/me` - Get current user's profile
- `PATCH /auth/me` - Update current user's profile

### User Discovery

- `GET /auth/users?q={query}&page={page}&size={size}` - Search users
- `GET /auth/users/{id}` - Get user profile by ID

## Authentication Flow

1. **Login**: User clicks "Login with Google" → redirected to `/auth/login/google`
2. **OAuth**: Google authenticates user → redirects back to callback
3. **User Sync**: Service creates/updates user in database
4. **Token Generation**: Service issues JWT access token + session cookie
5. **API Access**: Client uses access token in `Authorization: Bearer` header
6. **Token Refresh**: When access token expires, use session cookie to get new one
7. **Logout**: Client calls `/auth/logout` to invalidate session

## Database Schema

The service uses the `auth_service` schema in PostgreSQL:

- **users** - User profiles and OAuth identities
- **sessions** - Refresh token sessions

See [schema.sql](../../../infra/postgres/init-scripts/schema.sql) for details.

## Security

- Access tokens: Short-lived (10 min), stateless JWT
- Refresh tokens: Long-lived (24 hours), stored in HTTP-only cookies, server-side validation
- CORS: Configured per environment
- Role-based authorization using JWT claims
- Banned users are rejected at token generation

## Development

See [DEV_DOC.md](DEV_DOC.md) for detailed development information including:
- Architecture overview
- Code structure
- API specifications
- Testing guidelines
- Development workflow

## Resources

- [Quarkus Documentation](https://quarkus.io/)
- [Quarkus OIDC Guide](https://quarkus.io/guides/security-oidc-code-flow-authentication)
- [SmallRye JWT](https://github.com/smallrye/smallrye-jwt)
