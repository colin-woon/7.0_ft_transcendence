# Forum Service

A REST API microservice for a project-based discussion forum, built with **FastAPI** and **PostgreSQL**.

---

## Overview

The 42overflow forum service allows users to browse 42 projects, create discussion posts, leave comments, upvote/downvote content, and subscribe to projects they care about. It runs as a containerized service behind an API gateway, which handles authentication and injects the user identity via request headers.

---

## Tech Stack

**Framework** - FastAPI (Python 3.13)
**Database** PostgreSQL (via SQLAlchemy 2.0 ORM)
**Validation** - Pydantic v2
**Server** - Uvicorn (ASGI)
**Metrics** - Prometheus via 'prometheus-fastapi-instrumentator'
**Packaging** - uv

---

## Architecture

```
services/forum/
├── src/
│   ├── main.py       # FastAPI app, route definitions, startup logic
│   ├── models.py     # SQLAlchemy ORM models (database schema)
│   ├── schemas.py    # Pydantic request/response schemas
│   ├── logic.py      # Business logic (queries, mutations, rules)
│   └── database.py   # DB engine, session factory, dependency
├── data/
│   └── response.json # Seed data for 42 projects
├── Dockerfile        # Multi-stage build (dev + production)
└── pyproject.toml    # Dependencies
```

### Component Responsibilities

- **main.py** — Declares all API routes and wires up dependencies. On startup, it creates tables, optionally seeds project data (refer to forum.env.example), and backfills denormalized counters.
- **models.py** — Defines the database schema as Python classes using SQLAlchemy's mapped-column syntax.
- **schemas.py** — Defines what request bodies must contain and what responses look like, using Pydantic for automatic validation and serialization.
- **logic.py** — Contains all business rules: vote toggling, ownership checks, best-answer detection, hot-score sorting, etc. Routes call logic functions rather than querying the database directly.
- **database.py** — Configures the database connection from 'DATABASE_URL' and provides a 'get_db()' session dependency for FastAPI.

---

## Database Schema

```
Project
├── id, slug (unique), name, description
├── solo, difficulty, xp, estimate_time, objectives[]
└── post_count (denormalized)

ForumPost
├── id, author_id, project_id (FK → Project)
├── title, content, view_count
└── comment_count (denormalized)

Comment
├── id, author_id, post_id (FK → ForumPost)
├── content, is_best_answer
└── created_at

PostVote / CommentVote
├── PK: (post_id/comment_id, user_id)
└── vote_value: 1 (up) or -1 (down)

ProjectSubscription
├── PK: (project_id, user_id)
└── subscribed_at
```

---

## Authentication & Authorization

The service does not handle user auth. The upstream API gateway validates the JWT and forwards two headers with every request:

X-Intra-User-Id - Authenticated user's numeric ID
X-Intra-User-Roles - Comma-separated roles (e.g. `admin,user`)

Requests missing these headers receive a `401 Unauthorized`.

**Role rules:**
- **Admin** — can create, edit, and delete projects
- **Owner or Admin** — can edit or delete their own posts/comments
- **Any authenticated user** — can read everything, create posts/comments, vote, and subscribe

---

## API Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{"status": "ok"}` |

### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List all projects (paginated, sorted by hot score) |
| GET | `/projects/{id}` | Get project details |
| POST | `/projects` | Create project *(admin only)* |
| PATCH | `/projects/{id}` | Update project *(admin only)* |
| DELETE | `/projects/{id}` | Delete project *(admin only)* |
| POST | `/projects/{id}/subscribe` | Subscribe to a project |
| DELETE | `/projects/{id}/subscribe` | Unsubscribe from a project |
| GET | `/projects/me/subscriptions` | Current user's subscriptions |
| GET | `/projects/{id}/subscription-status` | Check if subscribed |
| GET | `/projects/{id}/subscribers/count` | Count of subscribers |

### Posts
| Method | Path | Description |
|---|---|---|
| GET | `/posts` | All posts (default sort) |
| GET | `/posts/top` | All posts sorted by vote score |
| GET | `/posts/new` | All posts sorted by newest |
| GET | `/projects/{id}/posts` | Posts within a project |
| GET | `/projects/{id}/posts/top` | Project posts by votes |
| GET | `/projects/{id}/posts/new` | Project posts by newest |
| POST | `/projects/{id}/posts` | Create a post |
| GET | `/posts/{id}` | Post detail (increments view count) |
| PATCH | `/posts/{id}` | Edit post *(owner or admin)* |
| DELETE | `/posts/{id}` | Delete post *(owner or admin)* |

### Comments
| Method | Path | Description |
|---|---|---|
| GET | `/posts/{id}/comments` | Comments sorted by votes then date |
| GET | `/posts/{id}/comments/top` | Comments by top votes |
| GET | `/posts/{id}/comments/new` | Comments by newest |
| POST | `/posts/{id}/comments` | Create a comment |
| PATCH | `/posts/{id}/comments/{cid}` | Edit comment *(owner or admin)* |
| DELETE | `/posts/{id}/comments/{cid}` | Delete comment *(owner or admin)* |

### Voting
| Method | Path | Description |
|---|---|---|
| POST | `/posts/{id}/vote` | Vote on a post (`{"vote_value": 1}` or `-1`) |
| POST | `/posts/{id}/comments/{cid}/vote` | Vote on a comment |

> Sending the same vote twice **removes** it (toggle). Sending the opposite value **switches** the vote.

### Search
| Method | Path | Description |
|---|---|---|
| GET | `/search/projects?q=<query>` | Search projects by name |
| GET | `/search/posts?q=<query>` | Search posts by title |

> Queries must be 2–20 characters. Searches are case-insensitive.

---

## Key Features

**Hot Score Sorting** — Projects are ranked by `post_count + total comment count`, surfacing the most active projects at the top.

**Denormalized Counters** — `post_count` on projects and `comment_count` on posts are kept in sync on every create/delete to avoid expensive `COUNT(*)` queries. A backfill runs on startup to correct any drift.

**Best Answer Detection** — When fetching comments, the top-voted comment with a positive score is automatically flagged as `is_best_answer`. This is computed at read time, not stored.

**Idempotent Subscriptions** — Subscribing when already subscribed is a no-op (returns success without error).

**Metrics** — Prometheus metrics are exposed at `/metrics` for monitoring request rates, latencies, and error codes.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SEED_PROJECTS` | No | Set to `true` to seed projects on startup |
| `SEED_PROJECTS_FILE` | No | Path to seed JSON (default: `data/response.json`) |

---

## Running Locally

```bash
# Install dependencies
uv sync

# Run dev server (with hot reload)
make dev
```

The service listens on `http://localhost:8000` in development and port `8443` (HTTPS) in production.
