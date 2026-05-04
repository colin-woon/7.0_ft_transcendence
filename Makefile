.DEFAULT_GOAL := help

# ---- Configuration ------------------------------------------------------
COMPOSE          ?= docker compose
COMPOSE_PROD     := $(COMPOSE) -f docker-compose.yml --env-file ./environment/shared.env
COMPOSE_DEV      := $(COMPOSE) -f docker-compose.yml -f docker-compose.override.yml --env-file ./environment/shared.env
GRAFANA_PROD_DS  := ./infra/obs/grafana/provisioning/datasources/prometheus.prod.yml
DR_BACKUP_FILE   ?= ./shared/backups/postgres/last/postgres_db-latest.sql.gz
DR_DB_VOLUME     ?= 42overflow_postgres_data

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
.PHONY: all up build rebuild restart logs stop down ensure-certs

all: up-all

up: up-all
up-all: ensure-certs
	$(COMPOSE_PROD) --profile all up -d --build

build: build-all
build-all: ensure-certs
	$(COMPOSE_PROD) --profile all build --no-cache

rebuild: rebuild-all
rebuild-all: ensure-certs
	$(COMPOSE_PROD) --profile all down
	$(COMPOSE_PROD) --profile all up -d --build --force-recreate

restart: restart-all
restart-all: ensure-certs
	$(COMPOSE_PROD) --profile all restart

logs: logs-all
logs-all: ensure-certs
	$(COMPOSE_PROD) --profile all logs -f --tail=200

stop:
	$(COMPOSE_PROD) --profile all stop

down:
	$(COMPOSE_PROD) --profile all down --remove-orphans

clean:
	$(COMPOSE_PROD) --profile all down -v --remove-orphans

# ---- Production (Surgical Targets) --------------------------------------
# Usage: make build-gateway, make up-auth, etc.

build-%: ensure-certs
	$(COMPOSE_PROD) build --no-cache $*-service

up-%: ensure-certs
	$(COMPOSE_PROD) up -d --build $*-service

rebuild-%: ensure-certs
	$(COMPOSE_PROD) up -d --build --force-recreate $*-service

restart-%: ensure-certs
	$(COMPOSE_PROD) restart $*-service

logs-%: ensure-certs
	$(COMPOSE_PROD) logs -f --tail=200 $*-service

# Legacy shorthands for quick start
auth chat forum web gateway nginx prometheus grafana: ensure-certs
	$(COMPOSE_PROD) up -d --build $@-service

# ---- Development Targets (Group) ----------------------------------------
.PHONY: dev-all dev-up dev-build dev-rebuild

dev-all: dev-up
dev-up: ensure-certs
	$(COMPOSE_DEV) --profile all up -d --build

dev-build: ensure-certs
	$(COMPOSE_DEV) --profile all build --no-cache

dev-rebuild: ensure-certs
	$(COMPOSE_DEV) --profile all down
	$(COMPOSE_DEV) --profile all up -d --build --force-recreate

# ---- Development Targets (Surgical) -------------------------------------
# Usage: make dev-build-gateway, make dev-up-auth, etc.

dev-build-%: ensure-certs
	$(COMPOSE_DEV) build --no-cache $*-service

dev-up-%: ensure-certs
	$(COMPOSE_DEV) up -d --build $*-service

dev-rebuild-%: ensure-certs
	$(COMPOSE_DEV) up -d --build --force-recreate $*-service

dev-restart-%: ensure-certs
	$(COMPOSE_DEV) restart $*-service

dev-logs-%: ensure-certs
	$(COMPOSE_DEV) logs -f --tail=200 $*-service

# ---- Maintenance --------------------------------------------------------
.PHONY: ps config clean prune certs certs-clean certs-verify grafana
.PHONY: dr-stop-services dr-start-services dr-recreate-db dr-db-ready dr-reset-db dr-restore-last

ps:
	$(COMPOSE_PROD) ps

config:
	$(COMPOSE_PROD) config

prune:
	docker system prune -f

dr-stop-services:
	$(COMPOSE_PROD) stop nginx-service gateway-service auth-service forum-service chat-service web-service db-backup-service postgres-exporter-service

dr-start-services:
	$(COMPOSE_PROD) start postgres-exporter-service db-backup-service auth-service forum-service chat-service web-service gateway-service nginx-service

dr-recreate-db:
	$(COMPOSE_PROD) stop db-service
	$(COMPOSE_PROD) rm -f db-service
	@docker volume inspect $(DR_DB_VOLUME) >/dev/null 2>&1 && docker volume rm $(DR_DB_VOLUME) || true
	$(COMPOSE_PROD) up -d db-service

dr-db-ready:
	$(COMPOSE_PROD) exec db-service sh -lc 'pg_isready -U "$$POSTGRES_USER" -d postgres'

dr-reset-db:
	$(COMPOSE_PROD) exec db-service sh -lc 'psql -U "$$POSTGRES_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '\''$$POSTGRES_DB'\'' AND pid <> pg_backend_pid();"'
	$(COMPOSE_PROD) exec db-service sh -lc 'psql -U "$$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$$POSTGRES_DB\";"'
	$(COMPOSE_PROD) exec db-service sh -lc 'psql -U "$$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$$POSTGRES_DB\";"'

dr-restore-last:
	test -r $(DR_BACKUP_FILE)
	gzip -t $(DR_BACKUP_FILE)
	gunzip -c $(DR_BACKUP_FILE) | $(COMPOSE_PROD) exec -T db-service sh -lc 'psql -v ON_ERROR_STOP=on -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

ensure-certs:
	@(test -d ./certs && test -f "$(GRAFANA_PROD_DS)") || ./certs.sh

certs:
	./certs.sh

certs-clean:
	./certs.sh clean

certs-verify:
	./certs.sh verify
