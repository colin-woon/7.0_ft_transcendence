_This project has been created as part of the 42 curriculum by <loginA>, <loginB>, <loginC>, <loginD>, <loginE>._

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

- [Development Environment Setup](./docs/dev_env_setup.md)

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

Replace the placeholder logins and names below with the final team values before submission.

### Member A

- Placeholder login: `<loginA>`
- Role: Product Owner
- Responsibilities:
    - gateway service
    - backend coordination across service boundaries
    - DevOps and observability setup

### Member B

- Placeholder login: `<loginB>`
- Role: Project Manager
- Responsibilities:
    - forum service
    - web forum implementation
    - coordination of forum-facing product scope

### Member C

- Placeholder login: `<loginC>`
- Role: Architect
- Responsibilities:
    - chat service
    - web chat implementation
    - friends-related architecture and flows

### Member D

- Placeholder login: `<loginD>`
- Role: Developer
- Responsibilities:
    - auth service
    - web authentication and user login flows

### Member E

- Placeholder login: `<loginE>`
- Role: Developer
- Responsibilities:
    - overall web implementation
    - shared frontend delivery and integration work

---

## Project Management

Work was organized through role ownership and service/domain boundaries:

- gateway, backend integration, and DevOps ownership
- forum service and forum UI ownership
- chat service and chat UI ownership
- auth service and authentication UI ownership
- frontend integration and shared UI ownership

The team coordinated through:

- code reviews
- shared documentation
- direct collaboration across service boundaries

Replace the placeholders below with the exact tools/channels used during submission preparation if needed:

- task tracking: Github Issues
- communication channel: Discord
- Meeting cadence: short syncs 2–3 times per week, with additional ad hoc calls during integration and debugging.

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
- Main contributors: Member D, Member E

### Forum

- Project-based discussion boards
- Posts and replies
- Voting interactions
- Structured technical discussion
- Main contributors: Member B, Member E

### Chat and Social Interaction

- Friend system
- Online status visibility
- Direct messaging
- Chat history persistence
- Typing indicators
- Read receipts
- Main contributors: Member C, Member E

### Gateway and Platform Security

- Centralized API routing
- Cookie-JWT authentication resolution
- Role-based access control enforcement
- Rate limiting
- Request filtering and policy enforcement
- Main contributors: Member A

### DevOps and Observability

- Multi-service Docker deployment
- Health checks
- Prometheus metrics
- Grafana dashboards
- Alerting rules
- Backups and disaster recovery documentation
- Main contributors: Member A

---

## Modules

### Selected Modules

- Web Module
    - Major: framework for both frontend and backend
    - Major: user interaction
    - Minor: ORM
    - Minor: SSR
    - Minor: notification system
    - Minor: advanced search, filtering, sorting, and pagination

- User Management Module
    - Major: standard user management and authentication
    - Major: advanced permissions system
    - Minor: remote authentication with OAuth 2.0

- Gaming and User Experience Module
    - Minor: advanced chat features

- DevOps Module
    - Major: monitoring system with Prometheus and Grafana
    - Major: backend as microservices
    - Minor: health checks, backups, and disaster recovery procedures

- Modules of Choice
    - Major: zero-trust API gateway and policy enforcement layer

### Point Calculation

- Major: 16 points
- Minor: 7 points
- Total: 23 points

### Module Implementation References

- [Project Overview](./docs/0.project_overview.md)
- [Product Requirements](./docs/1.product_requirements.md)
- [Custom Module Justification: Gateway](./docs/custom_module_gateway.md)
- [`TODO.local.md`](./TODO.local.md) for the working module checklist during development

### Module Ownership

- Web: Members B, C, D, E
- User Management: Members C, D, E
- Gaming and User Experience: Members C, E
- DevOps: Member A
- Modules of Choice: Member A

---

## Individual Contributions

### Member A

- Gateway architecture and implementation
- Backend policy enforcement design
- DevOps setup, monitoring, and observability

### Member B

- Forum service implementation
- Forum-facing web integration
- Coordination of forum product scope

### Member C

- Chat service implementation
- Chat UI integration
- Friends-related architecture and behavior

### Member D

- Auth service implementation
- Authentication and login-related frontend flows

### Member E

- Shared frontend implementation
- Cross-page web integration and UI delivery

---

## Resources

### Project References

- [ft_transcendence.pdf](./ft_transcendence.pdf)
- [Project Overview](./docs/0.project_overview.md)
- [Product Requirements](./docs/1.product_requirements.md)
- [Architectural Decisions](./docs/2.architectual_decisions.md)
- [Technical Decisions](./docs/3.technical_decisions.md)
- [Disaster Recovery](./docs/disaster_recovery.md)
- service-local documentation under `services/*/docs/`

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

AI output was treated as assistive material and was reviewed, corrected, and integrated within the project's actual codebase and team decisions.
