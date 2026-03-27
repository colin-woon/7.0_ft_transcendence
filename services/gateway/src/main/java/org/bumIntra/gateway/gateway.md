## Gateway Folder Responsibilities

### `api/`
**Incoming HTTP endpoints**

- Defines REST endpoints exposed by the gateway
- Handles request parsing and response forwarding
- Delegates calls to downstream services via clients

**Contains:**
- Gateway routes (e.g. `/api/auth/**`)
- No business logic
- No database access

---

### `client/`
**Outgoing service calls**

- REST clients for downstream services
- Encapsulates HTTP communication details
- Uses MicroProfile REST Client

**Contains:**
- One client interface per downstream service
- No routing or request handling logic

---

### `filter/`
**Cross-cutting request handling**

- Intercepts requests before they reach routes
- Used for authentication, logging, tracing, rate limiting

**Typical use cases:**
- Read/validate headers (e.g. `Authorization`)
- Add correlation IDs
- Enforce gateway-wide rules

---

### `security/`
**Security helpers and identity models**

- JWT parsing and validation helpers
- User identity and role extraction
- Security-related utilities

**Does NOT expose endpoints**

---

### `health/`
**Infrastructure and liveness checks**

- Health and readiness endpoints
- Used by monitoring systems and orchestration tools

**Examples:**
- `/health`
- `/ready`

---

### `config/`
**Typed configuration (optional)**

- Strongly-typed configuration classes
- Maps values from `application.properties`

Used when configuration becomes non-trivial.

---

### `exception/`
**Centralized error handling**

- Exception mappers
- Standardized error responses
- Translates internal errors to HTTP responses

---

### `websocket/`
**WebSocket entry points**

- WebSocket endpoints and session handling
- Authentication during handshake
- Real-time communication support

---

## Design Principles

- The gateway **does not own business logic**
- Downstream services own domain behavior
- The gateway focuses on:
  - Routing
  - Authentication
  - Authorization
  - Observability
  - Protocol handling

This structure is designed to scale cleanly as new services,
security mechanisms, and transport layers are added.

---

