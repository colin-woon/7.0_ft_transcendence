FROM python:3.13.11-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# copy and install shared infra dependencies
COPY infra/postgres/pyproject.toml ./
RUN uv sync --no-install-project

# copy shared source and service-specific code
COPY infra/postgres/src/ ./src/
COPY services/db_service/main.py ./
COPY services/db_service/schemas.py ./src/

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]