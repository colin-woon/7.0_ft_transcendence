package = 
SERVICE_NAME = forum_service
# $(1) is the command name for the error message
define check_package
	@if [ -z "$(package)" ]; then \
		echo "-------------------------------------------------------"; \
		echo "❌ ERROR: No package specified."; \
		echo "Usage:   make $(1) package=<name>"; \
		echo "Example: make $(1) package=fastapi"; \
		echo "-------------------------------------------------------"; \
		exit 1; \
	fi
endef

# Ensure commands run even if a file named 'dev' exists
.PHONY: dev lint format test typecheck setup add add-dev remove remove-dev start list

# Default command when you just type 'make'
all: dev

dev:
	uv run uvicorn src.main:app --reload

start:
	uv run uvicorn src.main:app --host 0.0.0.0 --port 8000

lint:
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv run ruff check .; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv run ruff check .; \
	fi

format:
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv run ruff format .; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv run ruff format .; \
	fi

test:
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv run pytest; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv run pytest; \
	fi

typecheck:
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv run pyright; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv run pyright; \
	fi

setup:
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) sh -c "uv sync && uv run python --version"; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv sync; \
		uv run python --version; \
	fi

# ...existing code...

add:
	$(call check_package,add)
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv add $(package); \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv add $(package); \
	fi

add-dev:
	$(call check_package,add-dev)
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv add --dev $(package); \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv add --dev $(package); \
	fi

remove:
	$(call check_package,remove)
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv remove $(package); \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv remove $(package); \
	fi

remove-dev:
	$(call check_package,remove-dev)
	@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv remove $(package) --group dev; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv remove $(package) --group dev; \
	fi

list:
		@if [ -n "$$(docker ps -q -f name=$(SERVICE_NAME))" ]; then \
		echo "🚀 Container detected. Running inside Docker..."; \
		docker exec -it $(SERVICE_NAME) uv tree; \
	else \
		echo "⚠️ No container found. Running locally..."; \
		uv tree; \
	fi