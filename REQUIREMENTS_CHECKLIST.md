# 42 Overflow - Product Owner Requirements Checklist

This document tracks the fulfillment of the **ft_transcendence** project requirements (Version 19.0).
Each module and requirement is cross-referenced with the project PDF.

---

## 🛑 MANDATORY PART (Chapter III)

_These must be 100% complete to avoid project rejection._

- [x] **III.2: General Requirements**
    - [x] Web application (Next.js / Quarkus / FastAPI / Go).
    - [x] Backend, Frontend, and Database (PostgreSQL / Redis).
    - [x] Meaningful git commit history (across the team).
    - [x] Containerization (Docker Compose) - `make all`.
    - [x] Browser compatibility (Google Chrome).
    - [x] No console errors/warnings.
    - [ ] **Privacy Policy & Terms of Service pages (Footer links).**
- [ ] **III.2: Multi-user Support**
    - [x] Multiple concurrent users supported.
    - [ ] Real-time updates reflected (via SSE/WS).
    - [ ] No data corruption on simultaneous actions.
- [ ] **III.3: Technical Requirements**
    - [x] CSS Framework (Tailwind CSS v4).
    - [ ] Secure User Management (Email/Password).
    - [ ] Input Validation (Frontend + Backend).
    - [x] **HTTPS Everywhere (mTLS + TLS Termination at Nginx).**
    - [x] Local `.env` file management (with examples).
    - [x] Database Schema (Well-defined relations).

---

## 🏆 CHOSEN MODULES (Chapter IV)

_Target: 14+ Points Total_

### 1. Web Module (IV.1) - [Estimated: 8 Points]

- [x] **Major (2pt):** Framework for both Frontend & Backend (Next.js / Quarkus / FastAPI / Go).
- [ ] **Major (2pt):** Real-time features (SSE for Chat).
    - [x] Backend logic (Go Chat service).
    - [ ] Frontend integration.
- [ ] **Major (2pt):** User Interaction (Chat, Profile, Friends).
    - [ ] Standard Chat system (Send/Receive).
    - [ ] Profile System (View user info).
    - [ ] Friends System (Add/Remove/List).
- [ ] **Major (2pt):** Public API (5 endpoints + X-API-KEY). x
    - [x] Rate Limiting (Redis-backed Gateway).
    - [ ] Documentation (OpenAPI/Swagger UI).
    - [ ] X-API-KEY implementation in Gateway.
- [x] **Minor (1pt):** Use of an ORM (Hibernate, SQLAlchemy, sqlc).
- [x] **Minor (1pt):** Server-Side Rendering (Next.js SSR).
      minor : custom made design system ( minimum 10) debatable and optional
      minor : advanced search and filtering in forum and chat

### 2. User Management Module (IV.3) - [Estimated: 3 Points]

- [ ] **Major (2pt):** Standard user management (Update profile, avatars, online status).
- [x] **Minor (1pt):** Remote Authentication (OAuth 2.0 - 42 Intranet/Google/GitHub).
      major: advanced permissions system (admin/moderator roles, content moderation tools)
- [ ] Major (2pt): Organization of user
      game module: major: real time chat

### 3. Devops Module (IV.7) - [Estimated: 4 Points]

- [x] **Major (2pt):** Backend as Microservices (Loose coupling, clear interfaces).
- [ ] **Major (2pt):** Monitoring System (Prometheus & Grafana).
    - [x] Metrics Generation (Gateway refactor).
    - [x] Infrastructure Deployment (Prometheus/Grafana containers).
- [ ] **Minor (1pt):** Health Check & Status Page. to be check
    - [x] Gateway Health endpoints.
    - [ ] Auth/Chat/Forum Health endpoints.
    - [ ] Status Dashboard UI.

---

## 🔒 CYBERSECURITY MODULE (IV.5) - [Estimated: 2 Points]

- [ ] **Major (2pt):** WAF/ModSecurity (Hardened) + HashiCorp Vault.
    - [ ] Nginx Hardening (WAF Rules).
    - [ ] Vault for secrets (DB creds, JWT keys).

---

## 📊 CURRENT POINT TALLY

- **Total Estimated:** **17 Points** (Target: 14)
- **Status:** 🚀 Ahead of schedule, focusing on Infrastructure and Integration.
