# 42 Overflow - Evaluation & Audit Guide (2026)

This guide is based on the official 42 Network **ft_transcendence** evaluation sheet and is used as the primary context for project validation.

---

## 🛑 MANDATORY PRE-FLIGHT (Avoid 0)
*If any of these fail, the grade is 0.*

1.  **Containerization:** The project MUST launch with a single command: `make all` (which calls `docker-compose up --build`).
2.  **No "Stop-Errors":** Any unhandled exception, 500 error, or service crash during the defense is an immediate failure.
3.  **Authentication:** Passwords must be hashed. No plain-text passwords in the DB or `.env`.
4.  **Security:** All user inputs must be validated on the SERVER side (not just frontend).
5.  **Git History:** Must show meaningful contributions from all team members.

---

## 🏆 MODULE SCORING (Target: 14+ Points)
*We have chosen a high-redundancy path to ensure 14 points even if one module is partially rejected.*

### **1. WEB MODULE (IV.1) - Potential: 8 Points**
*   **Major (2pt):** Use of frameworks (Next.js / Quarkus / FastAPI / Go).
*   **Major (2pt):** Real-time features (SSE for Chat).
    *   *Audit:* Evaluator will open two browsers and check for instant message delivery.
*   **Major (2pt):** User Interaction (Chat, Profile, Friends).
    *   *Audit:* Evaluator will try to add a friend, block them, and check the profile page.
*   **Major (2pt):** Public API (5 endpoints + X-API-KEY).
    *   *Audit:* Evaluator will use `curl` with your API Key to fetch data from the terminal.
*   **Minor (1pt):** Use of an ORM (Hibernate / SQLAlchemy / sqlc).
*   **Minor (1pt):** Server-Side Rendering (Next.js SSR).

### **2. USER MANAGEMENT (IV.3) - Potential: 3 Points**
*   **Major (2pt):** Standard user management (Profiles, Avatars).
*   **Minor (1pt):** Remote Auth (OAuth 2.0).
    *   *Audit:* Evaluator will click "Login with 42" and verify the flow.

### **3. DEVOPS (IV.7) - Potential: 4 Points**
*   **Major (2pt):** Microservices Architecture.
    *   *Audit:* Explain the separation of Gateway, Auth, Chat, and Forum.
*   **Major (2pt):** Monitoring (Prometheus & Grafana).
    *   *Audit:* Show the Grafana dashboard with real-time Gateway traffic.
*   **Minor (1pt):** Health Checks.
    *   *Audit:* Show the `/q/health` endpoint on the Gateway.

---

## 💎 THE "SENIOR" DEFENSE STRATEGY
*Use these talking points to impress the evaluator and secure "Outstanding" marks.*

1.  **Observability Logic:** "We didn't just use a plugin; we built a custom `GatewayObserverMetrics` layer using the **Memoization** pattern to ensure high performance and low GC pressure under load."
2.  **Security Architecture:** "Our Gateway handles TLS termination and acts as a **Zero-Trust** shield, validating JWTs and Rate-Limiting requests before they even touch our internal services."
3.  **Technical Debt Management:** "We used Java **Records** for our metric keys to ensure type-safety and immutable hash-map performance, mirroring professional C++ patterns."

---

## 📈 CURRENT AUDIT STATUS
*Last updated: March 21, 2026*

- **Docker:** ✅ Functional
- **Microservices:** ✅ Functional
- **Monitoring (Generation):** ✅ Complete (Senior Level)
- **Monitoring (Collection):** ⏳ In Progress
- **Public API:** ⏳ Logic exists, Key implementation pending
