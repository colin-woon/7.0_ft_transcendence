FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Development ──────────────────────────────────────────────────────────────
# uv syncs deps on first `uv run`; source is bind-mounted from the host.
FROM base AS development

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]

# ── Production ───────────────────────────────────────────────────────────────
# Deps are locked and source is baked in; no bind mounts at runtime.
FROM base AS production

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src/ ./src/
COPY data/ ./data/

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8443"]
