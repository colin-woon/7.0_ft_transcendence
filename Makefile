.DEFAULT_GOAL := help

COMPOSE         ?= docker compose
COMPOSE_PROD    := $(COMPOSE) -f docker-compose.yml --env-file ./environment/shared.env
COMPOSE_DEV     := $(COMPOSE) -f docker-compose.yml -f docker-compose.override.yml --env-file ./environment/shared.env
PROFILE         ?= all
DEV_PROFILES    ?= --profile all

.PHONY: help
help:
	@echo ""
	@echo "Production (docker-compose.yml only):"
	@echo "  make auth | chat | forum | web | gateway | nginx | all"
	@echo "  make down        PROFILE=<profile>"
	@echo "  make build       PROFILE=<profile>   # no-cache fresh build"
	@echo "  make rebuild     PROFILE=<profile>   # no-cache fresh build + start"
	@echo "  make logs        PROFILE=<profile>"
	@echo "  make restart     PROFILE=<profile>"
	@echo ""
	@echo "Development (docker-compose.yml + docker-compose.override.yml):"
	@echo "  make dev-auth | dev-chat | dev-forum | dev-web | dev-gateway | dev-all"
	@echo "    note: dev-auth/chat/forum/web also start gateway"
	@echo "  make dev-build    PROFILE=<profile>   # no-cache build only"
	@echo "  make dev-rebuild  PROFILE=<profile>   # no-cache build + start"
	@echo "  make dev-recreate PROFILE=<profile>   # restart without rebuild"
	@echo "  (use make down / logs / restart for stop/logs/restart)"
	@echo ""
	@echo "Shared:"
	@echo "  make ps | config | clean"
	@echo ""

# ---- Production targets ------------------------------------------------
.PHONY: auth chat forum web gateway nginx all
auth:     PROFILE=auth
chat:     PROFILE=chat
forum:    PROFILE=forum
web:      PROFILE=web
gateway:  PROFILE=gateway
nginx:    PROFILE=nginx
all:      PROFILE=all
auth chat forum web gateway nginx all: prod-up

prod-up:
	$(COMPOSE_PROD) --profile $(PROFILE) up -d --build

down:
	$(COMPOSE_PROD) --profile $(PROFILE) stop

build:
	$(COMPOSE_PROD) --profile $(PROFILE) build --no-cache

rebuild:
	$(COMPOSE_PROD) --profile $(PROFILE) build --no-cache
	$(COMPOSE_PROD) --profile $(PROFILE) up -d

restart:
	$(COMPOSE_PROD) --profile $(PROFILE) restart

logs:
	$(COMPOSE_PROD) --profile $(PROFILE) logs -f --tail=200

# ---- Development targets ------------------------------------------------
.PHONY: dev-auth dev-chat dev-forum dev-web dev-gateway dev-all dev-up dev-recreate dev-build dev-rebuild
dev-auth:     DEV_PROFILES=--profile auth --profile gateway
dev-chat:     DEV_PROFILES=--profile chat --profile gateway
dev-forum:    DEV_PROFILES=--profile forum --profile gateway
dev-web:      DEV_PROFILES=--profile web --profile gateway
dev-gateway:  DEV_PROFILES=--profile gateway
dev-all:      DEV_PROFILES=--profile all
dev-auth dev-chat dev-forum dev-web dev-gateway dev-all: dev-up

dev-up:
	$(COMPOSE_DEV) $(DEV_PROFILES) up -d --build

dev-recreate:
	$(COMPOSE_DEV) $(DEV_PROFILES) up -d --force-recreate --no-build

dev-build:
	$(COMPOSE_DEV) $(DEV_PROFILES) build --no-cache

dev-rebuild:
	$(COMPOSE_DEV) $(DEV_PROFILES) build --no-cache
	$(COMPOSE_DEV) $(DEV_PROFILES) up -d --force-recreate

# ---- Shared targets -----------------------------------------------------
.PHONY: ps config stop pull clean

ps:
	$(COMPOSE_PROD) ps

config:
	$(COMPOSE_PROD) config

stop:
	$(COMPOSE_PROD) stop

pull:
	$(COMPOSE_PROD) --profile $(PROFILE) pull

clean:
	$(COMPOSE_PROD) down -v --remove-orphans
