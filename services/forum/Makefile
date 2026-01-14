package = 
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
	uv run ruff check .

format:
	uv run ruff format .

test:
	uv run pytest

typecheck:
	uv run pyright

setup:
	uv sync
	uv run python --version

add:
	$(call check_package,add)
	uv add $(package)

add-dev:
	$(call check_package,add-dev)
	uv add --dev $(package)

remove:
	$(call check_package,remove)
	uv remove $(package)

remove-dev:
	$(call check_package,remove-dev)
	uv remove $(package) --group dev

list:
	uv tree