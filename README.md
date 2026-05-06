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

---

## Modules

### Selected Modules

- Web Module
    - Major: framework for both frontend and backend
    - Major: realtime features
    - Major: user interaction
    - Minor: ORM
    - Minor: SSR
    - Minor: advanced search, filtering, sorting, and pagination

- User Management Module
    - Major: standard user management and authentication
    - Major: advanced permissions system
    - Minor: remote authentication with OAuth 2.0

- User Experience Module
    - Minor: advanced chat features

- DevOps Module
    - Major: monitoring system with Prometheus and Grafana
    - Major: backend as microservices
    - Minor: health checks, backups, and disaster recovery procedures

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

### Module Justification Summary

- Web, User Management, and User Experience were chosen because they match the product's social and collaborative platform direction.
- DevOps was chosen to make the platform observable, operable, and demonstrable as a production-style multi-service system.
- The custom gateway module was chosen because the project needed one central control plane for routing, authentication, RBAC, request policy, and observability.

### Module Ownership

- Web: tjun-fan, cwoon, jothomas, rteoh
- User Management: cwoon, jothomas, rteoh
- User Experience: cwoon, rteoh
- DevOps: vlow
- Modules of Choice: vlow

---

# \<FORMAT PLACEHOLDER\>

## Minor/Major: Implement Server-Side Rendering
- **Justification:** \<placeholder text\>
- **Implementation:** \<placeholder text\>
- **Involved Members:** \<placeholder text\>

EXAMPLE:
## Minor: Implement Server-Side Rendering
- **Justification:** faster loading?
- **Implementation:** used SSR in Forum Pages through Next.js server actions (something like that)
- **Involved Members:** tjun-fan

---

## Individual Contributions

### vlow

- Gateway architecture and implementation
- Backend policy enforcement design
- DevOps setup, monitoring, and observability
- Challenge note: `<to be filled by vlow>`

### tjun-fan

- Forum service implementation
- Forum-facing web integration
- Coordination of forum product scope
- Challenge note: `<to be filled by tjun-fan>`

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

- [ft_transcendence.pdf](./ft_transcendence.pdf)
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
