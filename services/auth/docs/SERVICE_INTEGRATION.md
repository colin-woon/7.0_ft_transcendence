# Service-to-Service Authentication Guide

This guide shows how to implement JWT authentication in your microservices to validate tokens issued by the Auth Service.

---

## Architecture Overview

```
┌─────────────┐       JWT Token        ┌───────────────┐
│   Client    │ ──────────────────────>│ Auth Service  │
└─────────────┘                         └───────────────┘
       │                                        │
       │  1. Login / Get Token                 │ Issues JWT
       │  2. Use Token to access services      │ (RS256 signed)
       │                                        │
       ▼                                        ▼
┌─────────────────────────────────────────────────────┐
│              Other Microservices                    │
│  (Forum, Chat, etc.)                                │
│  - Validate JWT signature using public key         │
│  - Extract user ID, role, email from claims        │
│  - Implement role-based authorization               │
└─────────────────────────────────────────────────────┘
```

**JWT Claims Structure:**
```json
{
  "sub": "123",                     // User ID
  "upn": "user@example.com",        // Email (User Principal Name)
  "groups": ["STUDENT"],            // Roles (or ["ADMIN"])
  "iat": 1234567890,                // Issued at
  "exp": 1234568490,                // Expires at
  "iss": "http://localhost:8002",   // Issuer
  "aud": "http://localhost:8002"    // Audience
}
```

---

## Method 1: Java/Quarkus Services (Recommended for Java)

### 1. Add Dependencies (pom.xml)

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-jwt</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-security</artifactId>
</dependency>
```

### 2. Copy Public Key

Copy the `publicKey.pem` from auth service to your service:

```bash
cp services/auth/src/main/resources/publicKey.pem services/YOUR_SERVICE/src/main/resources/
```

### 3. Configure JWT Validation (application.properties)

```properties
# JWT Verification
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=http://localhost:8002
smallrye.jwt.token.header=Authorization
smallrye.jwt.token.cookie=sessionId

# If you want to enable RBAC
quarkus.http.auth.permission.authenticated.paths=/api/*
quarkus.http.auth.permission.authenticated.policy=authenticated

quarkus.http.auth.permission.admin-only.paths=/admin/*
quarkus.http.auth.permission.admin-only.policy=role-policy
quarkus.http.auth.permission.admin-only.roles-allowed=ADMIN
```

### 4. Use JWT in Your Resources

```java
package com.example.forum.api;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/threads")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ThreadResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity identity;

    /**
     * Public endpoint - no auth required
     */
    @GET
    public List<Thread> getPublicThreads() {
        return threadService.getPublicThreads();
    }

    /**
     * Authenticated endpoint - any logged-in user
     */
    @POST
    @Authenticated
    public Thread createThread(ThreadDTO dto) {
        // Get user ID from JWT
        Long userId = Long.parseLong(jwt.getSubject());
        String userEmail = jwt.getName();
        
        return threadService.createThread(userId, dto);
    }

    /**
     * Role-based endpoint - admins only
     */
    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public void deleteThread(@PathParam("id") Long threadId) {
        threadService.deleteThread(threadId);
    }

    /**
     * Custom authorization logic
     */
    @PATCH
    @Path("/{id}")
    @Authenticated
    public Thread updateThread(@PathParam("id") Long threadId, ThreadDTO dto) {
        Long userId = Long.parseLong(jwt.getSubject());
        
        Thread thread = threadService.findById(threadId);
        
        // Only thread author or admin can update
        if (!thread.getAuthorId().equals(userId) && !identity.hasRole("ADMIN")) {
            throw new ForbiddenException("You don't have permission to update this thread");
        }
        
        return threadService.updateThread(threadId, dto);
    }

    /**
     * Extract all JWT claims manually
     */
    @GET
    @Path("/me")
    @Authenticated
    public UserInfo getCurrentUserInfo() {
        return new UserInfo(
            Long.parseLong(jwt.getSubject()),
            jwt.getName(), // email
            jwt.getGroups(), // roles
            jwt.getClaim("iat"),
            jwt.getClaim("exp")
        );
    }
}
```

### 5. Custom JWT Service (Optional)

```java
package com.example.service;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class AuthContextService {

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity identity;

    /**
     * Get current user ID
     */
    public Long getCurrentUserId() {
        if (identity.isAnonymous()) {
            throw new UnauthorizedException("User not authenticated");
        }
        return Long.parseLong(jwt.getSubject());
    }

    /**
     * Get current user email
     */
    public String getCurrentUserEmail() {
        if (identity.isAnonymous()) {
            throw new UnauthorizedException("User not authenticated");
        }
        return jwt.getName();
    }

    /**
     * Check if current user has role
     */
    public boolean hasRole(String role) {
        return identity.hasRole(role);
    }

    /**
     * Check if current user is admin
     */
    public boolean isAdmin() {
        return identity.hasRole("ADMIN");
    }

    /**
     * Check if user can access resource
     * (is owner or admin)
     */
    public boolean canAccessResource(Long resourceOwnerId) {
        if (isAdmin()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        return currentUserId.equals(resourceOwnerId);
    }
}
```

---

## Method 2: Python/FastAPI Services

### 1. Install Dependencies

```bash
pip install python-jose[cryptography] pydantic fastapi
```

### 2. Copy Public Key

```bash
cp services/auth/src/main/resources/publicKey.pem services/forum/publicKey.pem
```

### 3. JWT Validation Utility

```python
# services/forum/src/auth.py

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime

# Load public key
with open("publicKey.pem", "r") as f:
    PUBLIC_KEY = f.read()

ALGORITHM = "RS256"
ISSUER = "http://localhost:8002"

security = HTTPBearer()


class TokenPayload(BaseModel):
    sub: str  # User ID
    upn: str  # Email
    groups: list[str]  # Roles
    exp: int
    iat: int
    iss: str
    aud: str


class CurrentUser(BaseModel):
    id: int
    email: str
    roles: list[str]

    def is_admin(self) -> bool:
        return "ADMIN" in self.roles

    def has_role(self, role: str) -> bool:
        return role in self.roles


def decode_token(token: str) -> TokenPayload:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=ISSUER,
        )
        return TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """
    Dependency to get current authenticated user
    Use: def endpoint(user: CurrentUser = Depends(get_current_user))
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    # Check token expiration
    if payload.exp < int(datetime.utcnow().timestamp()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    
    return CurrentUser(
        id=int(payload.sub),
        email=payload.upn,
        roles=payload.groups,
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[CurrentUser]:
    """
    Optional authentication - returns None if not authenticated
    """
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(required_role: str):
    """
    Dependency factory for role-based access control
    Usage: def endpoint(user: CurrentUser = Depends(require_role("ADMIN")))
    """
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not user.has_role(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required",
            )
        return user
    return role_checker


async def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Require admin role"""
    if not user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
```

### 4. Use in FastAPI Endpoints

```python
# services/forum/src/main.py

from fastapi import FastAPI, Depends, HTTPException
from auth import get_current_user, get_current_user_optional, require_admin, CurrentUser

app = FastAPI()


@app.get("/api/threads")
async def get_threads(
    user: Optional[CurrentUser] = Depends(get_current_user_optional)
):
    """Public endpoint - authentication optional"""
    # user will be None if not authenticated
    return {"threads": [...], "authenticated": user is not None}


@app.post("/api/threads")
async def create_thread(
    thread_data: dict,
    user: CurrentUser = Depends(get_current_user),
):
    """Protected endpoint - authentication required"""
    # user is guaranteed to be authenticated here
    return {
        "message": "Thread created",
        "author_id": user.id,
        "author_email": user.email,
    }


@app.delete("/api/threads/{thread_id}")
async def delete_thread(
    thread_id: int,
    user: CurrentUser = Depends(require_admin),
):
    """Admin-only endpoint"""
    # Only admins can reach here
    return {"message": f"Thread {thread_id} deleted by admin {user.email}"}


@app.put("/api/threads/{thread_id}")
async def update_thread(
    thread_id: int,
    thread_data: dict,
    user: CurrentUser = Depends(get_current_user),
):
    """Custom authorization - owner or admin"""
    # Fetch thread from database
    thread = get_thread_from_db(thread_id)
    
    # Check if user is owner or admin
    if thread.author_id != user.id and not user.is_admin():
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to update this thread",
        )
    
    # Update thread
    return {"message": "Thread updated"}


@app.get("/api/me")
async def get_my_info(user: CurrentUser = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": user.id,
        "email": user.email,
        "roles": user.roles,
        "is_admin": user.is_admin(),
    }
```

---

## Method 3: Manual JWT Validation (Any Language)

If using a different framework, here's the manual approach:

### Steps:

1. **Extract token** from `Authorization: Bearer <token>` header
2. **Decode JWT** (without verification first)
3. **Verify signature** using RS256 with public key
4. **Validate claims**:
   - Check `exp` (expiration)
   - Check `iss` (issuer matches auth service URL)
   - Check `aud` (audience matches auth service URL)
5. **Extract user data** from claims (`sub`, `upn`, `groups`)

### Example (Node.js/Express):

```javascript
// npm install jsonwebtoken

const jwt = require('jsonwebtoken');
const fs = require('fs');

const PUBLIC_KEY = fs.readFileSync('publicKey.pem');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'http://localhost:8002',
    audience: 'http://localhost:8002',
  }, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = {
      id: parseInt(payload.sub),
      email: payload.upn,
      roles: payload.groups,
    };

    next();
  });
}

// Usage
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Protected data',
    user: req.user,
  });
});
```

---

## Testing

### Get a Token

```bash
# 1. Login via browser (http://localhost:8002/auth/login/google)
# 2. Extract token from response

# Or use curl (if you have valid session cookie):
curl -X POST http://localhost:8002/auth/refresh \
  --cookie "sessionId=your-session-id"
```

### Test Your Service

```bash
# Test authenticated endpoint
curl -X GET http://localhost:8003/api/threads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should get 401 without token
curl -X POST http://localhost:8003/api/threads \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

---

## Security Best Practices

1. **Always validate token signature** - don't trust client data
2. **Check token expiration** - reject expired tokens
3. **Validate issuer and audience** - prevent token reuse across services
4. **Use HTTPS in production** - tokens sent over HTTP can be intercepted
5. **Keep public key secure** - while public, protect from modification
6. **Implement rate limiting** - prevent brute force attacks
7. **Log authentication failures** - for security monitoring

---

## Common Issues

### Issue: "Invalid signature"
- Ensure you're using the correct public key
- Check that key file is properly formatted (PEM format)
- Verify the auth service is using the corresponding private key

### Issue: "Token expired"
- Implement token refresh on the client side
- Tokens expire after 10 minutes by default

### Issue: "Invalid issuer"
- Ensure `mp.jwt.verify.issuer` matches auth service URL
- Check environment-specific URLs (localhost vs production)

### Issue: User ID not found
- Remember: `sub` claim contains user ID as string
- Parse to integer/long when needed: `Long.parseLong(jwt.getSubject())`
