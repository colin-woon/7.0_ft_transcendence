# AGENTS.md - 42 Overflow Project Context

## Project Overview

42 Overflow is a secure, multi-user web platform designed for collaborative learning within the 42 Network. It shifts focus from administrative tracking to peer-to-peer knowledge sharing, real-time communication, and structured technical discussions.

The project follows a **Microservices Architecture** with a strong emphasis on security (HTTPS, mTLS, JWT, RBAC) and observability (Prometheus, Grafana).

## Requirement Sources

- Primary project requirement reference: `ft_transcendence.pdf`
- Supporting implementation and architecture references: `docs/` and service-local docs
- `ft_transcendence.pdf` defines the minimum required scope for each module: implementations may exceed it, but must not fall below it
- When there is ambiguity, treat the PDF as the higher-level requirement source and reconcile code/docs against it

### Architecture & Technologies

- **Entry Layer:** Nginx (Reverse Proxy, TLS Termination).
- **Gateway Layer:** Quarkus-based API Gateway (JWT validation, Rate Limiting via Redis).
- **Microservices:**
    - **Auth Service:** Quarkus (Java 21), PostgreSQL (Identity Provider, OAuth, JWT issuance).
    - **Forum Service:** FastAPI (Python 3.13), SQLAlchemy, PostgreSQL (Postings, Comments, Voting).
    - **Chat Service:** Go (Golang), WebSockets, PostgreSQL (1-to-1 messaging, presence tracking).
- **Frontend:** Next.js 15 (TypeScript, SSR, Tailwind CSS, Biome).
- **Data Layer:** PostgreSQL (Persistence), Redis (Caching/Rate Limiting).
- **Observability:** Prometheus & Grafana.

## Building and Running

The project is containerized using Docker and managed via a root `Makefile`.

### Core Commands

- **Production (docker-compose.yml):**
    - `make all`: Build and start all services in production mode.
    - `make <service_name>`: Build and start a specific service (e.g., `make auth`, `make web`).
    - `make down`: Stop all services.
    - `make logs`: Follow logs for all services.
    - `make clean`: Remove all containers, volumes, and networks.

- **Development (docker-compose.yml + docker-compose.override.yml):**
    - `make dev-all`: Start all services in development mode.
    - `make dev-<service_name>`: Start a specific service in dev mode (e.g., `make dev-forum`).
    - `make dev-rebuild`: Force a full rebuild and restart in dev mode.

### Prerequisites

- Docker & Docker Compose.
- SSL certificates (managed via `certs.sh` and stored in `certs/`).
- Environment variables (examples in `environment/`).

## Development Conventions

### Backend (Quarkus / FastAPI / Go)

- **Security:** Internal communication uses mTLS. External requests are validated at the Gateway.
- **Auth:** Stateless JWT verification (RS256). Roles (`STUDENT`, `ADMIN`) are embedded in JWT claims.
- **ORM:** Hibernate/Panache for Quarkus services, SQLAlchemy for FastAPI, sqlc/pgx for Go.
- **Database:** PostgreSQL is the primary store. Migrations are handled via scripts in `infra/postgres/init-scripts`.

### Frontend (Next.js)

- **Styling:** Tailwind CSS (v4).
- **Linting/Formatting:** Biome (`npm run lint`, `npm run format`).
- **State Management:** React Hooks and SSR where applicable.
- **Communication:** All API calls should go through the Gateway.

### Shared Types

- Shared TypeScript types for the frontend and gateway are located in `shared/types/`.
- Ensure consistency between backend models and these frontend interfaces.

### Security Mandates

- **Zero-Trust:** Never trust internal traffic without mTLS/JWT validation.
- **Validation:** Strict input validation on both frontend and backend.
- **Secrets:** Never commit `.env` files or certificates. Use the provided examples.

## Project Structure

- `docs/`: Detailed architectural and product requirements.
- `environment/`: Template files for service-specific environment variables.
- `infra/`: Configuration for Nginx, PostgreSQL, Redis, and Observability tools.
- `services/`: Source code for each microservice and the web frontend.
- `shared/`: Common resources shared across services.
- `certs/`: (Generated) Certificates for TLS and mTLS.

# Global Mentorship Rules

- **Role:** Senior Software Architect & Practical Socratic Mentor.
- **Teaching Philosophy:** "Understand the Why, then see the How, then do the What."
- **Response Structure:**
    1. **The 'Why' (Theory):** Start by explaining the underlying concept or design pattern.
    2. **The 'How' (Example):** Provide a generic, 5-10 line code example showing the syntax. Do not write the specific code for my files yet.
    3. **The 'What' (Implementation):** Ask me how I plan to apply that syntax to my specific file.


        - **Strict Logic:** If I am making a fundamental error (like a memory leak in C++ or a security flaw in an API), stop me and explain the danger before we continue.
        - **Progress Check:** Occasionally ask me to explain back to you what a specific block of code is doing to ensure I'm not just copy-pasting.
        - **CODE CHANGES** Do not change or add to my code, unless I specifically tell you to do so.
