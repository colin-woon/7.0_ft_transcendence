.DEFAULT_GOAL := help

COMPOSE         ?= docker compose
COMPOSE_PROD    := $(COMPOSE) -f docker-compose.yml
COMPOSE_DEV     := $(COMPOSE) -f docker-compose.yml -f docker-compose.override.yml
PROFILE         ?= all

.PHONY: help
help:
	@echo ""
	@echo "Production (docker-compose.yml only):"
	@echo "  make auth | chat | forum | web | gateway | nginx | gw-redis | all"
	@echo "  make down        PROFILE=<profile>"
	@echo "  make build       PROFILE=<profile>   # no-cache fresh build"
	@echo "  make rebuild     PROFILE=<profile>   # no-cache fresh build + start"
	@echo "  make logs        PROFILE=<profile>"
	@echo "  make restart     PROFILE=<profile>"
	@echo ""
	@echo "Development (docker-compose.yml + docker-compose.override.yml):"
	@echo "  make dev-auth | dev-chat | dev-forum | dev-web | dev-all"
	@echo "  make dev-down    PROFILE=<profile>"
	@echo "  make dev-build   PROFILE=<profile>"
	@echo "  make dev-logs    PROFILE=<profile>"
	@echo "  make dev-restart PROFILE=<profile>"
	@echo ""
	@echo "Shared:"
	@echo "  make ps | config | clean"
	@echo ""

# ---- Production targets ------------------------------------------------
.PHONY: auth chat forum web gateway nginx gw-redis all
auth:     PROFILE=auth
chat:     PROFILE=chat
forum:    PROFILE=forum
web:      PROFILE=web
gateway:  PROFILE=gateway
nginx:    PROFILE=nginx
gw-redis: PROFILE=gw-redis
all:      PROFILE=all
auth chat forum web gateway nginx gw-redis all: prod-up

prod-up:
	$(COMPOSE_PROD) --env-file ./environment/shared.env --profile $(PROFILE) up -d --build

down:
	$(COMPOSE_PROD) --profile $(PROFILE) stop

build:
	$(COMPOSE_PROD) --profile $(PROFILE) build --no-cache

rebuild:
	$(COMPOSE_PROD) --profile $(PROFILE) build --no-cache
	$(COMPOSE_PROD) --env-file ./environment/shared.env --profile $(PROFILE) up -d

restart:
	$(COMPOSE_PROD) --profile $(PROFILE) restart

logs:
	$(COMPOSE_PROD) --profile $(PROFILE) logs -f --tail=200

# ---- Development targets ------------------------------------------------
.PHONY: dev-auth dev-chat dev-forum dev-web dev-all
dev-auth:  PROFILE=auth
dev-chat:  PROFILE=chat
dev-forum: PROFILE=forum
dev-web:   PROFILE=web
dev-all:   PROFILE=all
dev-auth dev-chat dev-forum dev-web dev-all: dev-up

dev-up:
	$(COMPOSE_DEV) --env-file ./environment/shared.env --profile $(PROFILE) up -d

dev-down:
	$(COMPOSE_DEV) --profile $(PROFILE) stop

dev-build:
	$(COMPOSE_DEV) --profile $(PROFILE) build

dev-logs:
	$(COMPOSE_DEV) --profile $(PROFILE) logs -f --tail=200

dev-restart:
	$(COMPOSE_DEV) --profile $(PROFILE) restart

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
