# Auth Service - Developer Documentation

Technical documentation for developers working on the Auth Service.

## Table of Contents

- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [API Specification](#api-specification)
- [Data Models](#data-models)
- [Authentication Flow](#authentication-flow)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Development Setup

### SDKMAN Installation

The project uses SDKMAN for Java version management:

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash

# Install project dependencies
sdk env install

# Set default env for your terminal
sdk env

# Enable auto env (optional - avoids running sdk env on every new terminal)
vim ~/.sdkman/etc/config
# Add: sdkman_auto_env=true
```

### RSA Key Pair Generation

The service requires RSA key pairs for JWT signing:

```bash
cd services/auth/src/main/resources

# Generate private key
openssl genrsa -out privateKey.pem 2048

# Extract public key
openssl rsa -in privateKey.pem -pubout -out publicKey.pem
```

### Local Development

```bash
# Option 1: Use Docker (recommended)
make auth  # From project root

# Option 2: Run locally with Quarkus dev mode
cd services/auth
./mvnw quarkus:dev

# Dev UI available at: http://localhost:8080/q/dev
```

## Architecture

### High-Level Overview

```
[Client] 
   ↓
[NGINX Reverse Proxy (future)]
   ↓
[Auth Service :8002]
   ↓
[PostgreSQL :5432] (auth_service schema)
```

### Technology Stack

- **Quarkus 3.30.5**: Reactive Java framework
- **Hibernate ORM + Panache**: Database access layer
- **Quarkus OIDC**: OAuth 2.0 / OpenID Connect client
- **SmallRye JWT**: JWT generation and signing
- **PostgreSQL 18**: Primary database
- **Maven**: Build and dependency management

### Key Design Patterns

1. **Multi-Tenant OIDC**: Separate configurations for Google, 42, etc.
2. **Security Identity Augmentation**: `UserSyncAugmentor` enriches auth context
3. **Repository Pattern**: Panache repositories for data access
4. **DTO Pattern**: Separate DTOs from entities
5. **Stateless Access Tokens + Stateful Refresh Tokens**: Hybrid approach

## Code Structure

```
services/auth/
├── docs/                        # Documentation
├── src/
│   ├── main/
│   │   ├── docker/             # Dockerfiles
│   │   ├── java/org/acme/
│   │   │   ├── api/            # REST endpoints
│   │   │   │   ├── AuthResource.java      # Authentication endpoints
│   │   │   │   └── GreetingResource.java  # Test endpoint
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   │   ├── UserInfoDTO.java       # Full user info
│   │   │   │   ├── UserSummaryDTO.java    # Brief user info (search)
│   │   │   │   ├── UserUpdateDTO.java     # Profile update payload
│   │   │   │   └── UserResponseDTO.java   # Login/refresh response
│   │   │   ├── model/          # Domain entities
│   │   │   │   ├── User.java              # User entity
│   │   │   │   ├── Session.java           # Session entity
│   │   │   │   └── UserRole.java          # Enum: STUDENT, ADMIN
│   │   │   ├── repository/     # Data access
│   │   │   │   ├── UserRepository.java    # User queries
│   │   │   │   └── SessionRepository.java # Session queries
│   │   │   └── service/        # Business logic
│   │   │       ├── AuthService.java       # Core auth logic
│   │   │       ├── UserService.java       # User sync logic
│   │   │       ├── UserSyncAugmentor.java # Security augmentation
│   │   │       └── CustomTenantResolver.java # OIDC tenant routing
│   │   └── resources/
│   │       ├── application.properties     # Configuration
│   │       ├── publicKey.pem              # JWT verification key
│   │       └── privateKey.pem             # JWT signing key
│   └── test/                   # Tests
├── pom.xml                     # Maven configuration
└── Makefile                    # Build shortcuts
```

## API Specification

### Authentication Endpoints

#### 1. Login

```http
GET /auth/login/{provider}
```

**Parameters:**
- `provider` (path): OAuth provider - `google` or `42`

**Authentication:** Required (OIDC redirect)

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 600,
  "user": {
    "id": 1,
    "username": "john_doe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://...",
    "bio": "Developer",
    "role": "STUDENT",
    "isBanned": false,
    "lastSeenAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "linkedWithGoogle": true,
    "linkedWithIntra": false
  }
}
```

**Cookies Set:**
- `sessionId`: HTTP-only session cookie for refresh token

---

#### 2. Refresh Token

```http
POST /auth/refresh
```

**Authentication:** Cookie (`sessionId`)

**Response:** `200 OK` (same structure as login)

**Error Responses:**
- `401 Unauthorized`: Invalid or expired session
- `403 Forbidden`: User is banned
- `404 Not Found`: Session or user not found

---

#### 3. Logout

```http
POST /auth/logout
```

**Authentication:** Required (JWT) + Cookie (`sessionId`)

**Response:** `200 OK`

```json
{
  "message": "Logged out"
}
```

**Cookies:** Clears `sessionId` cookie

---

#### 4. Delete Account

```http
DELETE /auth/delete
```

**Authentication:** Required (JWT)

**Response:** `204 No Content`

**Cookies:** Clears `sessionId` cookie

---

### User Profile Endpoints

#### 5. Get My Profile

```http
GET /auth/me
```

**Authentication:** Required (JWT)

**Response:** `200 OK` (returns `UserInfoDTO`)

---

#### 6. Update My Profile

```http
PATCH /auth/me
```

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "username": "new_username",
  "fullName": "New Full Name",
  "avatarUrl": "https://...",
  "bio": "Updated bio"
}
```

**Note:** All fields are optional (using `Optional<T>`)

**Response:** `200 OK` (returns updated `UserInfoDTO`)

**Error Responses:**
- `409 Conflict`: Username already taken

---

### User Discovery Endpoints

#### 7. Search Users

```http
GET /auth/users?q={query}&page={page}&size={size}
```

**Parameters:**
- `q` (query, optional): Search query (matches username or full name)
- `page` (query, optional, default: 0): Page number
- `size` (query, optional, default: 10): Page size

**Authentication:** Public (no auth required)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "username": "john_doe",
    "fullName": "John Doe",
    "avatarUrl": "https://..."
  },
  ...
]
```

---

#### 8. Get User by ID

```http
GET /auth/users/{id}
```

**Parameters:**
- `id` (path): User ID

**Authentication:** Public (no auth required)

**Response:** `200 OK` (returns `UserInfoDTO`)

**Error Responses:**
- `404 Not Found`: User not found

---

## Data Models

### User Entity

```java
@Entity
@Table(name = "users", schema = "auth_service")
public class User {
    Long id;                    // Primary key
    
    // OAuth identities
    String email;               // Unique, required
    String intraId;             // 42 OAuth ID (unique)
    String googleId;            // Google OAuth ID (unique)
    
    // Profile
    String username;            // Unique, required
    String fullName;
    String avatarUrl;
    String bio;
    
    // Security
    UserRole role;              // STUDENT or ADMIN
    boolean isBanned;
    Instant lastSeenAt;
    
    // Timestamps
    Instant createdAt;
    Instant updatedAt;
}
```

### Session Entity

```java
@Entity
@Table(name = "sessions", schema = "auth_service")
public class Session {
    Long id;                    // Primary key
    String sessionId;           // UUID (unique)
    Long userId;                // Foreign key to User
    Instant expiresAt;          // Expiration timestamp
    Instant createdAt;
}
```

### DTOs

**UserInfoDTO**: Complete user information (for /api/auth/me, /api/auth/users/{id})

**UserSummaryDTO**: Brief info for lists/searches (id, username, fullName, avatarUrl)

**UserUpdateDTO**: Update payload (all fields Optional)

**UserResponseDTO**: Login/refresh response (accessToken, expiresIn, user)

---

## Authentication Flow

### 1. OAuth Login Flow

```
1. User clicks "Login with Google"
   → Frontend redirects to: GET /api/public/auth/login/google

2. UserSyncAugmentor intercepts authentication
   → Extracts UserInfo from Google
   → Calls UserService.syncUser()

3. UserService.syncUser()
   → Checks if user exists by googleId
   → If not, checks by email
   → If not, creates new user
   → Returns User entity

4. UserSyncAugmentor adds User to SecurityIdentity

5. PublicAuthResource.login() executes
   → Calls AuthService.createToken() → generates JWT
   → Calls AuthService.createSessionCookie() → creates session in DB
   → Returns access token + session cookie
```

### 2. User Sync Logic

```java
// Google user sync priority:
1. Find by googleId
2. If not found → Find by email
3. If not found → Find by fullName
4. If not found → Create new user

// 42 user sync priority (same logic):
1. Find by intraId
2. If not found → Find by email
3. If not found → Find by fullName
4. If not found → Create new user
```

### 3. Token Refresh Flow

```
1. Client sends POST /auth/refresh with sessionId cookie

2. AuthService.refreshToken()
   → Validate sessionId exists in database
   → Check session not expired
   → Get user by userId
   → Check user not banned
   → Generate new JWT access token
   → Return new token (session cookie stays same)
```

### 4. JWT Structure

```json
{
  "sub": "123",              // User ID
  "upn": "user@example.com", // Email
  "groups": ["STUDENT"],     // Roles
  "iat": 1234567890,
  "exp": 1234568490,
  "iss": "http://localhost:8002",
  "aud": "http://localhost:8002"
}
```

---

## Development Workflow

### Quarkus Dev Mode

```bash
./mvnw quarkus:dev
```

**Features:**
- Live reload on code changes
- Dev UI: `http://localhost:8080/q/dev`
- Continuous testing (press `r` in terminal)
- Dev Services (auto-starts PostgreSQL container if not running)

### Building

```bash
# Development build
./mvnw package

# Production build (über-jar)
./mvnw package -Dquarkus.package.jar.type=uber-jar

# Native executable
./mvnw package -Dnative
```

### Docker Build

```bash
# From project root
docker compose --profile auth build

# Or using Makefile
make build PROFILE=auth
```

---

## Testing

### Unit Tests

```bash
./mvnw test
```

### Integration Tests

```bash
./mvnw verify
```

### Manual Testing

1. **Test Google OAuth:**
   - Go to `http://localhost:8002/auth/login/google`
   - Complete Google auth flow
   - Verify JWT token returned

2. **Test Refresh:**
   ```bash
   curl -X POST http://localhost:8002/auth/refresh \
     --cookie "sessionId=<your-session-id>"
   ```

3. **Test Profile Update:**
   ```bash
   curl -X PATCH http://localhost:8002/auth/me \
     -H "Authorization: Bearer <your-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"bio": "Updated bio"}'
   ```

---

## Troubleshooting

### OIDC Configuration Errors

**Error**: `Either 'jwks-path' or 'introspection-path' properties must be set`

**Solution**: Ensure these properties exist in `application.properties`:
```properties
quarkus.oidc.jwks-path=/jwks
quarkus.oidc.introspection-path=/introspection
```

### Database Connection Issues

**Error**: `Connection refused: db:5432`

**Solution**: 
1. Ensure PostgreSQL container is running
2. Check `docker compose ps`
3. Verify network connectivity: `docker compose --profile auth up`

### JWT Verification Failures

**Error**: `Unable to verify JWT signature`

**Solution**:
1. Ensure `publicKey.pem` and `privateKey.pem` exist in `src/main/resources`
2. Regenerate keys if necessary (see [Development Setup](#development-setup))
3. Restart the service after key changes

### Google OAuth Not Working

**Checklist**:
1. Valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment
2. Redirect URI configured in Google Console: `http://localhost:8002/auth/callback/google`
3. Check logs for OIDC errors: `quarkus.log.category."io.quarkus.oidc".level=DEBUG`

---

## Configuration Reference

Key properties in `application.properties`:

```properties
# Domain & URLs
app.domain.name=${DOMAIN_NAME:localhost}
app.public.url=http://${DOMAIN_NAME:localhost}:${PUBLIC_PORT:8002}

# Database
quarkus.datasource.jdbc.url=jdbc:postgresql://db:5432/postgres_db
quarkus.datasource.jdbc.schema=auth_service
quarkus.hibernate-orm.database.generation=update

# OIDC
quarkus.oidc.tenant-enabled=true
quarkus.oidc.discovery-enabled=false
quarkus.oidc.certificate.public-key-location=publicKey.pem

# Google OAuth
quarkus.oidc.google.provider=google
quarkus.oidc.google.client-id=${GOOGLE_CLIENT_ID}
quarkus.oidc.google.credentials.secret=${GOOGLE_CLIENT_SECRET}

# JWT
smallrye.jwt.sign.key.location=privateKey.pem
smallrye.jwt.new-token.signature-algorithm=RS256
smallrye.jwt.new-token.lifespan=${ACCESS_EXPIRY:600}
```

---

## Future Enhancements

- [ ] Implement 42 Intra OAuth (non-standard OIDC)
- [ ] Implement refresh token rotation
- [ ] Add admin endpoints for user management
- [ ] Implement CORS middleware

