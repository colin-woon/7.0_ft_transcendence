FROM python:3.13.11-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# copy and install shared infra dependencies
COPY services/forum/pyproject.toml ./
RUN uv sync --no-install-project

# copy shared source and service-specific code
COPY services/forum/src/ ./src

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]