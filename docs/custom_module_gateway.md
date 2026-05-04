# Custom Module Justification: Zero-Trust API Gateway

## Purpose

This document justifies the project's custom Major module under the `Modules of choice` category from the `ft_transcendence` subject.

The custom module is:

- **Zero-Trust API Gateway and Policy Enforcement Layer**

This module is implemented by the gateway service and its surrounding request-handling model.

---

## Why This Module Was Chosen

42 Overflow is built as a microservices platform with separate services for authentication, forum features, chat, and frontend delivery. In that architecture, the system needs a consistent control plane for authentication, authorization, routing, request validation, and transport policy.

The gateway was chosen as a custom module because it solves that problem in one place instead of duplicating security and policy logic across every backend service.

This decision supports the project's broader goals:

- enforce a zero-trust approach between entry traffic and internal services
- keep service boundaries clear
- centralize security-sensitive decisions
- make platform-wide request behavior observable and auditable

The gateway is not treated as a simple proxy. It is a policy-enforcement layer that actively participates in authentication, authorization, request shaping, resilience, and metrics collection.

---

## Technical Challenges It Addresses

The module addresses several cross-cutting technical challenges that affect the entire platform:

### 1. Centralized Identity Resolution

The gateway resolves browser-facing authentication from the `accessToken` cookie, validates JWT claims, and derives trusted request identity before traffic reaches backend services.

This allows downstream services to receive a normalized internal identity model instead of each service independently re-implementing browser auth parsing.

### 2. Role-Based Access Control

The gateway applies route-family-aware access rules, including admin-only restrictions for protected paths. This creates one authoritative enforcement point for permission-sensitive routes.

### 3. Request Policy Enforcement

The gateway applies policy checks before downstream execution, including:

- allowed-method validation
- request-header filtering
- request-body size checks for configured path families
- SSE request validation
- Redis-backed rate limiting

This reduces unnecessary downstream load and keeps request policy consistent across services.

### 4. Trusted Internal Context Propagation

After validating the external request, the gateway injects trusted internal headers such as request ID, auth level, user ID, roles, and forwarding context. This gives backend services the context they need without trusting raw external headers.

### 5. Realtime Transport Handling

The project uses realtime communication patterns that require more than plain request forwarding. The gateway includes stream-aware handling for chat SSE flows and preserves long-lived connection behavior while still keeping gateway-level policy enforcement in front of the stream.

### 6. Resilience and Error Mapping

The gateway isolates downstream behavior through service clients and fault-tolerance boundaries. It distinguishes upstream failures from gateway policy failures and maps them into consistent external responses.

### 7. Observability at the Platform Edge

Because every request passes through the gateway, it becomes the natural point for:

- request correlation
- structured logging
- latency measurement
- error classification
- Prometheus metrics

This makes the gateway an operational control surface as well as a traffic-control surface.

---

## How It Adds Value to the Project

This module adds value in four major ways:

### Security Value

It creates a single enforcement point for JWT validation, RBAC, request filtering, and internal identity propagation. That improves consistency and reduces the attack surface created by duplicated security logic across services.

### Architectural Value

It preserves clean service responsibilities. Auth handles identity issuance, forum handles discussions, chat handles messaging, and the gateway handles cross-service traffic policy.

### Operational Value

It improves observability by giving the project a central point for metrics, request logging, and failure classification. That makes it easier to diagnose failures, validate rate limiting, and inspect platform behavior.

### Project Relevance

The module is directly tied to the project's real requirements:

- multiple backend services
- protected routes
- admin-only capabilities
- realtime traffic
- internal service trust boundaries
- production-style monitoring

It is not an isolated technical experiment. It is part of the project's core runtime design.

---

## Why It Deserves Major Module Status

This module deserves Major status because it is both substantial in scope and technically complex in implementation.

It is substantial because:

- it affects all routed application traffic
- it sits between external clients and all backend services
- it combines security, routing, validation, resilience, and observability concerns

It is technically complex because it includes:

- cookie-based JWT resolution
- role-aware access control
- route-family classification
- request and header policy enforcement
- Redis-backed rate limiting
- downstream service proxying
- stream-aware gateway behavior
- structured metrics and logging hooks

This is significantly beyond a basic reverse proxy or a thin route forwarder. The module acts as a custom platform control layer that shapes how the rest of the system behaves.

For those reasons, it meets the subject's expectation for a custom **Major** module that is technically meaningful, relevant to the project context, and clearly more than a trivial feature.
