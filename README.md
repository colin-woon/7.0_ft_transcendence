_This project has been created as part of the 42 curriculum by vlow, tjun-fan, cwoon, jothomas, rteoh._

# 42 Overflow

## Description

42 Overflow is a secure social and collaborative platform built for the 42 Network. It combines structured technical discussion, direct user interaction, and production-style platform engineering in a single web application.

The product is designed around a simple goal:

- give 42 students a better place to discuss projects, connect with peers, and exchange knowledge in a secure multi-user environment

The platform emphasizes:

- user profiles and identity
- friendships and direct messaging
- project-focused discussion forums
- secure service boundaries
- operational visibility through monitoring

Project type:

- social and collaborative platform
- forum-driven knowledge sharing platform
- microservices-based web application with realtime interaction

For a longer overview, see:

- [Project Overview](./docs/0.project_overview.md)
- [Product Requirements](./docs/1.product_requirements.md)

---

## Key Features

- Secure authentication with email/password and OAuth 2.0 (`Google`, `42`)
- User profiles, avatar handling, and role-aware account management
- Friend relationships with online-status visibility
- Direct messaging with chat history persistence
- Typing indicators and read receipts
- Project-based technical discussion forums
- Voting-based interaction in the forum experience
- Centralized gateway routing, authentication, RBAC, and rate limiting
- Prometheus metrics, Grafana dashboards, alerts, backups, and disaster recovery documentation

---

## Instructions

### Prerequisites

- Docker
- Docker Compose
- generated TLS certificates
- local environment files based on the examples in [`environment/`](./environment)

### Environment Setup

1. Review the example files in [`environment/`](./environment).
2. Create your local `.env`-style files as required for the services you want to run.
3. Generate certificates using:

```bash
./certs.sh
```

For additional environment details, see:

- [`environment/`](./environment)
- [Project Overview](./docs/0.project_overview.md)

### Run the Project

Production-style stack:

```bash
make all
```

Development stack:

```bash
make dev-all
```

Useful commands:

```bash
make down
make logs
make clean
make dev-rebuild
```

### Main Runtime Surfaces

- web app: `https://localhost/`
- API entrypoint: `https://localhost/api/`

Operational and service-local details are documented in:

- [Project Overview](./docs/0.project_overview.md)
- [Disaster Recovery](./docs/disaster_recovery.md)
- service-local docs under `services/*/docs/`

---

## Team Information

### vlow

- 42 login: `vlow`
- GitHub: [Neikichi](https://github.com/Neikichi)
- Role: Product Owner
- Responsibilities:
    - gateway architecture
    - backend integration
    - DevOps
    - observability

### tjun-fan

- 42 login: `tjun-fan`
- GitHub: [wesleytaetae](https://github.com/wesleytaetae)
- Role: Project Manager
- Responsibilities:
    - forum service
    - forum UI
    - forum product coordination

### cwoon

- 42 login: `cwoon`
- GitHub: [colin-woon](https://github.com/colin-woon)
- Role: Tech Lead
- Responsibilities:
    - chat service
    - chat UI
    - friends flows
    - technical architecture

### jothomas

- 42 login: `jothomas`
- GitHub: [SolR3G3m](https://github.com/SolR3G3m)
- Role: Developer
- Responsibilities:
    - auth service
    - login flows
    - identity-related frontend integration

### rteoh

- 42 login: `rteoh`
- GitHub: [ricetea25](https://github.com/ricetea25)
- Role: Developer
- Responsibilities:
    - shared frontend implementation
    - integration
    - UI delivery

---

## Project Management

Work was organized through role ownership and service/domain boundaries:

- service and domain ownership with cross-review during integration
- gateway, backend integration, and DevOps ownership
- forum service and forum UI ownership
- chat service and chat UI ownership
- auth service and authentication UI ownership
- shared frontend integration and UI ownership

The team coordinated through:

- code reviews
- shared documentation
- direct collaboration across service boundaries

Project-management details:

- task distribution: service/domain ownership with cross-review during integration
- task tracking: `GitHub Issues / Projects`
- communication channel: `Discord`
- meeting cadence: 2 syncs per week plus ad hoc debugging calls

---

## Technical Stack

### Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- SSR

### Backend

- Gateway: Quarkus
- Auth Service: Quarkus
- Forum Service: FastAPI
- Chat Service: Go

### Data and Support

- PostgreSQL
- Redis
- Prometheus
- Grafana
- Nginx

### Technical Rationale

- **Next.js** was chosen for modern React-based frontend delivery with SSR support.
- **Quarkus** was chosen for performance-oriented backend services, especially gateway and auth responsibilities.
- **FastAPI** was chosen for the forum domain where rapid API development and Python ergonomics fit well.
- **Go** was chosen for the chat domain and realtime service behavior.
- **PostgreSQL** was chosen as the primary relational store for user, forum, and chat data.
- **Redis** was chosen for gateway-side rate limiting.
- **Prometheus + Grafana** provide operational visibility and alerting.

More architecture detail:

- [Project Overview](./docs/0.project_overview.md)
- [Architectural Decisions](./docs/2.architectual_decisions.md)
- [Technical Decisions](./docs/3.technical_decisions.md)

---

## Database Schema

The project uses PostgreSQL as the primary persistent store.

Main domains include:

- user and profile data
- friendships and social relationships
- forum discussion data
- chat and messaging data

High-level relationship summary:

- users own profile-related state and roles
- friendships connect users and drive direct-message access flows
- forum discussions link projects, posts, replies, and voting behavior
- chat state links users, rooms, message history, and presence-related behavior
- service-owned schemas separate the main application domains inside PostgreSQL

Primary schema source:

- [`infra/postgres/init-scripts/schema.sql`](./infra/postgres/init-scripts/schema.sql)

Supporting references:

- [Product Requirements](./docs/1.product_requirements.md)
- [Architectural Decisions](./docs/2.architectual_decisions.md)

---

## Features List

### Authentication and Identity

- Email/password authentication
- Google OAuth
- 42 OAuth
- Profile management
- Avatar support
- Role-based access control
- Main contributors: `vlow`, `jothomas`

### Forum

- Project-based discussion boards
- Posts and replies
- Voting interactions
- Structured technical discussion
- Main contributors: `tjun-fan`

### Chat and Social Interaction

- Friend system
- Online status visibility
- Direct messaging
- Chat history persistence
- Typing indicators
- Read receipts
- Main contributors: `cwoon`

### Gateway and Platform Security

- Centralized API routing
- Cookie-JWT authentication resolution
- Role-based access control enforcement
- Rate limiting
- Request filtering and policy enforcement
- Main contributors: `vlow`

### DevOps and Observability

- Multi-service Docker deployment
- Health checks
- Prometheus metrics
- Grafana dashboards
- Alerting rules
- Backups and disaster recovery documentation
- Main contributors: `vlow`


# Modules

### Selected Modules

- Web Module
    - Major: Use a framework for both the frontend and backend
    - Major: Implement real-time features using WebSockets or similar technology
    - Major: Allow users to interact with other users
    - Minor: Use an ORM for the Database
    - Minor: Implement Server-Side Rendering
    - Minor: Implement advanced search functionality with filters, sorting, and pagination

- User Management Module
    - Major: Standard User management and authentication
    - Major: Advanced Permissions System
    - Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.)

- User Experience Module
    - Minor: Advanced chat features (enhances the basic chat from "User interaction" module)

- DevOps Module
    - Major: Monitoring System with Prometheus and Grafana
    - Major: Backend as Microservices
    - Minor: Health Checks, Backups, and Disaster Recovery Procedures

- Modules of Choice
    - Major: zero-trust API gateway and policy enforcement layer

### Point Calculation

- Major: 16 points
- Minor: 6 points
- Total: 22 points

### Module Implementation References

- [Project Overview](./docs/0.project_overview.md)
- [Product Requirements](./docs/1.product_requirements.md)
- [Custom Module Justification: Gateway](./docs/custom_module_gateway.md)

### Module Implementation Summary

- Web
    - implemented with Next.js on the frontend and Quarkus / FastAPI / Go services on the backend
    - covers realtime interaction, core chat/profile/friends flows, SSR, and forum search/filtering
- User Management
    - implemented through the Auth Service, profile flows, OAuth login, role-aware views, and admin capabilities
- User Experience
    - implemented through advanced chat behavior including blocking, history persistence, typing indicators, read receipts, and profile access from chat
- DevOps
    - implemented through Docker-managed microservices, Prometheus scraping, Grafana dashboards and alerts, runtime health checks, backups, and a tested disaster recovery runbook
- Modules of Choice
    - implemented through the zero-trust API gateway, centralized RBAC, request policy enforcement, Redis-backed rate limiting, and edge observability

## Major: Use a framework for both the frontend and backend
- **Justification:** We leverage frameworks because they have built-in security abstractions and standardized middleware, ensuring our microservices remain resilient against common vulnerabilities without reinventing core infrastructure. This architectural choice allowed the team to focus on complex business logic and real-time integration rather than low-level HTTP handling and boilerplate configuration.
- **Implementation**:
  - Fullstack framework: Next.js, server side acts as a Backend-For-Frontend
  - Backend framework: Quarkus for auth/gateway, strong typing from Java and easy containerization; FastAPI for forum, helps with fast prototyping
- **Involved Members:** `jothomas`, `rteoh`, `vlow`, `tjun-fan`, `cwoon`

## Major: Implement real-time features using WebSockets or similar technology
- **Justification:** Since our platform has a chat function, making it real-time will improve user experience and allow information exchange efficiently. Most real-time features are only focused at the chat functionality.
- **Implementation:** Group chats are implemented to allow message broadcasting, real-time updates is applied to chat features such as typing indicators, instant messaging, read receipts, online statuses, unread indicators, and incoming friend requests. SSE also has a default reconnection behaviour with the `EventSource` function but it only works for instant server restarts, so an automated reconnection code is also added to ensure that real-time features come back when server was shut down for a long time.
- **Involved Members:** `cwoon`

## Major: Allow users to interact with other users.
- **Justification:** Allow users to chat directly on platform without switching to another app. Profile information also shows trustability and users can always reach out to trusted users through friendship management.
- **Implementation:** Profile UI is minimalistic, and users have the option to link to their 42 accounts to show 42 stats. The friends system is a two way relationship, allowing complex state switching between requested, pending, accepted and blocked. The chat system is implemented with a combination of HTTP POST(send) requests + SSE(receive), managing connections through go channels. The UI is inspired by Discord DMs.
- **Involved Members:** `cwoon`, `rteoh`, `jothomas`

## Minor: Use an ORM for the Database
- **Justification** Increased productivity (focus on business logic), Cleaner codebase (more concise and readable compared to SQL) and Built-in Securiy (uses parameterized queries, safe from SQL injections).
- **Implementation** SQLAlchemy used in Python Forum Backend, Hibernate for Java User/Auth Backend.
- **Involved Members** `tjun-fan`, `jothomas`

## Minor: Implement Server-Side Rendering
- **Justification** Reduced load on backend servers during mass load. 
- **Implementation** Projects list in forum containing hundreds (and increasing) of projects are loaded on the server once and served to clients on request using nextjs caching.
- **Involved Members** `tjun-fan`

## Minor: Implement advanced search functionality with filters, sorting, and pagination
- **Justification** Better UX for users, easier to search for projects/posts using the filters and sorting. Increased loading times for pages rendered client side.
- **Implementation** Forum /projects page utilizes all 3 functionalities, with filtering (by subscribed, difficulty etc...), sorting (by creation date, popularity or name) and pagination (10 posts per page). 
- **Involved Members** `tjun-fan`

## Major: Standard User management and authentication
- **Justification** Establishes user identity and enables secure authentication across multiple OAuth providers (Google, 42) and local password-based registration. Essential for supporting social interaction, profiles, and role-based access control.
- **Implementation** Auth Service provides password authentication with Argon2 hashing, OAuth 2.0 integration, JWT tokens, session management, and profile CRUD with avatar support. Gateway enforces authentication before protected routes.
- **Involved Members** `jothomas`, `cwoon`

## Major: Advanced Permissions System
- **Justification** Backend-enforced RBAC prevents authorization bypass and ensures admin-only operations (user management, moderation) cannot be circumvented. Enables role-aware views and actions critical for platform security and governance.
- **Implementation** Role enums `(STUDENT, ADMIN)` persisted to PostgreSQL, JWT group claims for stateless validation, gateway RBAC middleware for route authorization, and protected endpoints for admin actions. Authorization enforced at backend level before business logic.
- **Involved Members** `jothomas`, `vlow`

## Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.)
- **Justification** Since our platform is based a forum for 42 projects, we intended to get data from 42 API to populate user profile information and projects information. Google OAuth also allows ease of access and improves user experience to login without a password.
- **Implementation** Auth Service integrates Quarkus OIDC for Google and 42 Login/Link flows. It handles provider redirect callbacks, syncs user records. Authenticated sessions are issued as JWT accessToken and sessionId refresh cookies. OAuth data is further leveraged to populate user profiles with 42 campus and project data through a dedicated reload endpoint.
- **Involved Members** `jothomas`

## Minor: Advanced chat features (enhances the basic chat from "User interaction" module).
- **Justification:** Complements the real-time module, improves user experience significantly for chat function.
- **Implementation:** A clickable link and a dropdown option was added to the chat interface to view the user profile information. Blocked users are completely hidden from the chat interfaces, they will not appear in group chats too, their messages also wont load. Chat messages is always saved to the DB first before SSE sends the message back to the client. Typing indicators and read receipts are exclusively for friends only. To justify the module completion since this was a game module but we're not building a game, we also have unread indicators to show unopened chat messages and a one-time message request from non-friends to start a chat.
- **Involved Members:** `cwoon`

## Major: Monitoring System with Prometheus and Grafana
- **Justification**: This module provides the operational visibility layer of the stack. It gives one place to observe service health, gateway traffic, downstream failures, scrape freshness, and alert state across the platform.
- **Implementation**: Prometheus scrapes gateway, auth, forum, chat, web, and PostgreSQL exporter metrics. Grafana provides dashboards for service health, gateway traffic, latency, errors, and alerts. Alert rules were added for sustained failure states, and Grafana access is protected through the gateway under `/api/admin/grafana` with `ADMIN` RBAC.
- **Involved Members**: `vlow`

## Major: Backend as Microservices
- **Justification**: This module defines the service boundary structure of the stack. It separates security, identity, forum, chat, and frontend concerns into isolated runtime units with clear interfaces and responsibilities.
- **Implementation**: The platform is split into Nginx, Gateway, Auth, Forum, Chat, Web, PostgreSQL, Redis, Prometheus, and Grafana. Services communicate through gateway-controlled HTTPS/mTLS and REST interfaces, with the gateway acting as the central control plane for routing, auth, RBAC, and policy enforcement.
- **Involved Members**: `vlow`

## Minor: Health Checks, Backups, and Disaster Recovery Procedures
- **Justification**: This module provides the recovery and operator-readiness layer of the stack. It ensures service state can be observed, persistence can be backed up, and recovery can be performed in a controlled way during failure scenarios.
- **Implementation**: Runtime services expose health/readiness endpoints and Docker healthchecks. Grafana provides the operator-facing status dashboard. Automated PostgreSQL backups are stored outside the live DB volume, Prometheus alerts track persistent failure and backup health, and the disaster recovery procedure is documented and restore-tested.
- **Involved Members**: `vlow`

## Major: Zero-Trust API Gateway and Policy Enforcement Layer
- **Justification**: This module provides the central policy and transport control layer of the stack. It keeps routing, authentication, RBAC, rate limiting, downstream fault handling, and observability in one gateway instead of scattering those concerns across every service.
- **Implementation**: The Quarkus gateway validates cookie/JWT auth, resolves role-based access, applies request policy filters, performs Redis-backed rate limiting, maps downstream failures into consistent gateway errors, proxies realtime transport where needed, and emits structured logs and Prometheus metrics for all routed traffic.
- **Involved Members**: `vlow`

## Individual Contributions

### vlow

- Gateway architecture and implementation
- Backend policy enforcement design
- DevOps setup, monitoring, and observability
- Challenge note: `Implementing the gateway as the central zero-trust policy layer for routing, authentication, and RBAC, while also building the DevOps and observability foundation for monitoring, alerting, backups, and recovery.`

### tjun-fan

- Forum service implementation
- Forum-facing web integration
- Coordination of forum product scope
- Challenge note: `Difficulties in implementing interfaces/DTOs between frontend and backend without having a finalized scope. Also, getting Next.js server requests to work through the gateway infrastructure (by importing Mtls headers before sending the request). Lastly, integration with user/auth module (how to obtain/verify user identity in forum).`

### cwoon

- Chat service implementation
- Chat UI integration
- Friends-related architecture and behavior
- Challenge note: `<to be filled by cwoon>`

### jothomas

- Auth service implementation
- Authentication and login-related frontend flows
- Challenge note: `<to be filled by jothomas>`

### rteoh

- Shared frontend implementation
- Cross-page web integration and UI delivery
- Challenge note: `<to be filled by rteoh>`

---

## Resources

### Project References

- [Project Overview](./docs/0.project_overview.md)
- [Product Requirements](./docs/1.product_requirements.md)
- [Architectural Decisions](./docs/2.architectual_decisions.md)
- [Technical Decisions](./docs/3.technical_decisions.md)
- [Disaster Recovery](./docs/disaster_recovery.md)

### Technical Documentation

- Quarkus documentation
- FastAPI documentation
- Next.js documentation
- PostgreSQL documentation
- Redis documentation
- Prometheus documentation
- Grafana documentation
- Nginx documentation

### AI Usage Disclosure

AI tools were used as productivity aids during planning, explanation, review, and documentation support.

They were used for tasks such as:

- clarifying concepts and architectural tradeoffs
- refining documentation structure
- reviewing implementation ideas
- summarizing technical decisions
- drafting and refining public-facing documentation
- checking consistency across architecture, module, and DevOps documentation

AI output was treated as assistive material and was reviewed, corrected, and integrated within the project's actual codebase and team decisions.
