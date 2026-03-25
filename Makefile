.DEFAULT_GOAL := help

# ---- Configuration ------------------------------------------------------
COMPOSE          ?= docker compose
COMPOSE_PROD     := $(COMPOSE) -f docker-compose.yml --env-file ./environment/shared.env
COMPOSE_DEV      := $(COMPOSE) -f docker-compose.yml -f docker-compose.override.yml --env-file ./environment/shared.env
GRAFANA_PROD_DS  := ./infra/obs/grafana/provisioning/datasources/prometheus.prod.yml

.PHONY: help
help:
	@echo "========================================================================"
	@echo "42 Overflow - Infrastructure Management"
	@echo "========================================================================"
	@echo "All Targets:"
	@echo "  make all              Start all services (production mode)"
	@echo "  make dev-all          Start all services (development mode)"
	@echo "  make stop             Stop all running containers"
	@echo "  make down             Stop and remove project containers, networks, and orphans"
	@echo "  make clean            Remove project containers, volumes, and orphans"
	@echo "  make prune            Run docker system prune -f"
	@echo "  make certs            Reset and regenerate all TLS/JWT cert artifacts"
	@echo "  make certs-clean      Remove generated TLS/JWT cert artifacts"
	@echo "  make certs-verify     Verify generated certs and key sync"
	@echo ""
	@echo "Service Targets (replace <service> with gateway | auth | chat | forum | web | nginx | prometheus | grafana ):"
	@echo "  [PROD] make build-<service>    | [DEV] make dev-build-<service>"
	@echo "  [PROD] make up-<service>       | [DEV] make dev-up-<service>"
	@echo "  [PROD] make rebuild-<service>  | [DEV] make dev-rebuild-<service>"
	@echo "  [PROD] make logs-<service>     | [DEV] make dev-logs-<service>"
	@echo "  [PROD] make restart-<service>  | [DEV] make dev-restart-<service>"
	@echo "========================================================================"

# ---- Production (Group Targets) -----------------------------------------
.PHONY: all up build rebuild restart logs stop down ensure-prod-certs

all: up-all

up: up-all
up-all: ensure-prod-certs
	$(COMPOSE_PROD) --profile all up -d --build

build: build-all
build-all: ensure-prod-certs
	$(COMPOSE_PROD) --profile all build --no-cache

rebuild: rebuild-all
rebuild-all: ensure-prod-certs
	$(COMPOSE_PROD) --profile all down
	$(COMPOSE_PROD) --profile all up -d --build --force-recreate

restart: restart-all
restart-all:
	$(COMPOSE_PROD) --profile all restart

logs: logs-all
logs-all:
	$(COMPOSE_PROD) --profile all logs -f --tail=200

stop:
	$(COMPOSE_PROD) --profile all stop

down:
	$(COMPOSE_PROD) --profile all down --remove-orphans

clean:
	$(COMPOSE_PROD) --profile all down -v --remove-orphans

# ---- Production (Surgical Targets) --------------------------------------
# Usage: make build-gateway, make up-auth, etc.

build-%: ensure-prod-certs
	$(COMPOSE_PROD) build --no-cache $*-service

up-%: ensure-prod-certs
	$(COMPOSE_PROD) up -d --build $*-service

rebuild-%: ensure-prod-certs
	$(COMPOSE_PROD) up -d --build --force-recreate $*-service

restart-%:
	$(COMPOSE_PROD) restart $*-service

logs-%:
	$(COMPOSE_PROD) logs -f --tail=200 $*-service

# Legacy shorthands for quick start
auth chat forum web gateway nginx prometheus grafana: ensure-prod-certs
	$(COMPOSE_PROD) up -d --build $@-service

# ---- Development Targets (Group) ----------------------------------------
.PHONY: dev-all dev-up dev-build dev-rebuild

dev-all: dev-up
dev-up:
	$(COMPOSE_DEV) --profile all up -d --build

dev-build:
	$(COMPOSE_DEV) --profile all build --no-cache

dev-rebuild:
	$(COMPOSE_DEV) --profile all down
	$(COMPOSE_DEV) --profile all up -d --build --force-recreate

# ---- Development Targets (Surgical) -------------------------------------
# Usage: make dev-build-gateway, make dev-up-auth, etc.

dev-build-%:
	$(COMPOSE_DEV) build --no-cache $*-service

dev-up-%:
	$(COMPOSE_DEV) up -d --build $*-service

dev-rebuild-%:
	$(COMPOSE_DEV) up -d --build --force-recreate $*-service

dev-restart-%:
	$(COMPOSE_DEV) restart $*-service

dev-logs-%:
	$(COMPOSE_DEV) logs -f --tail=200 $*-service

# ---- Maintenance --------------------------------------------------------
.PHONY: ps config clean prune certs certs-clean certs-verify grafana

ps:
	$(COMPOSE_PROD) ps

config:
	$(COMPOSE_PROD) config

prune:
	docker system prune -f

ensure-prod-certs:
	@test -f $(GRAFANA_PROD_DS) || ./certs.sh

certs:
	./certs.sh

certs-clean:
	./certs.sh clean

certs-verify:
	./certs.sh verify
