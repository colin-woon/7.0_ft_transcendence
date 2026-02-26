.DEFAULT_GOAL := help

COMPOSE ?= docker compose
PROFILE ?= all

.PHONY: up down build restart logs ps config stop pull clean help
help:
	@echo "Usage:"
	@echo "  make auth"
	@echo "  make chat"
	@echo "  make forum"
	@echo "  make web"
	@echo "  make all"
	@echo "  make down PROFILE=auth"
	@echo "  make build PROFILE=forum"
	@echo "  make logs PROFILE=all"
	@echo "  make restart PROFILE=auth"

.PHONY: auth chat forum web all
auth: PROFILE=auth
auth: up

chat: PROFILE=chat
chat: up

forum: PROFILE=forum
forum: up

web: PROFILE=web
web: up

all: PROFILE=all
all: up

up:
	$(COMPOSE) --env-file ./environment/shared.env --profile $(PROFILE) up -d

down:
	$(COMPOSE) --profile $(PROFILE) stop

build:
	$(COMPOSE) --profile $(PROFILE) build

restart:
	$(COMPOSE) --profile $(PROFILE) restart

logs:
	$(COMPOSE) --profile $(PROFILE) logs -f --tail=200

ps:
	$(COMPOSE) ps

config:
	$(COMPOSE) config

stop:
	$(COMPOSE) stop

pull:
	$(COMPOSE) --profile $(PROFILE) pull

clean:
	$(COMPOSE) down -v --remove-orphans