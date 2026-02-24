.PHONY: help build-java build-gateway build-auth clean-java build \
        up up-d down restart logs logs-gateway logs-auth ps clean \
        rebuild rebuild-gateway rebuild-auth shell-gateway shell-auth \
        test-java dev-gateway dev-auth

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "bumIntra - Microservices Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build-java: ## Build all Java services (gateway, dummy auth)
	@echo "Building gateway service..."
	@cd services/gateway && ./mvnw package -DskipTests
	@echo "Building dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw package -DskipTests
	@echo "✅ Java services built successfully"

build-gateway: ## Build only gateway service
	@echo "Building gateway service..."
	@cd services/gateway && ./mvnw package -DskipTests
	@echo "✅ Gateway built successfully"

build-auth: ## Build only dummy auth service
	@echo "Building dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw package -DskipTests
	@echo "✅ Dummy auth built successfully"

clean-java: ## Clean all Java build artifacts
	@echo "Cleaning gateway..."
	@cd services/gateway && ./mvnw clean
	@echo "Cleaning dummy auth..."
	@cd services/dummy/gw_auth && ./mvnw clean
	@echo "✅ Java artifacts cleaned"

build: build-java ## Build all services
	@echo "✅ All services ready for Docker"

up: build-java ## Build Java services and start all containers
	docker compose up --build

up-d: build-java ## Build Java services and start all containers in detached mode
	docker compose up --build -d

down: ## Stop and remove all containers
	docker compose down

restart: down up ## Restart all services

logs: ## View logs from all services
	docker compose logs -f

logs-gateway: ## View logs from gateway service
	docker compose logs -f gateway-service

logs-auth: ## View logs from dummy auth service
	docker compose logs -f gw-auth-service

ps: ## Show running containers
	docker compose ps

clean: down clean-java ## Stop containers and clean build artifacts
	@echo "✅ Clean complete"

rebuild: clean build up ## Full rebuild and restart

rebuild-gateway: build-gateway ## Rebuild and restart only gateway service
	docker compose up --build -d gateway-service

rebuild-auth: build-auth ## Rebuild and restart only dummy auth service
	docker compose up --build -d gw-auth-service

shell-gateway: ## Open shell in gateway container
	docker exec -it gateway-service /bin/bash

shell-auth: ## Open shell in dummy auth container
	docker exec -it gw-auth-service /bin/bash

test-java: ## Run tests for all Java services
	@echo "Testing gateway service..."
	@cd services/gateway && ./mvnw test
	@echo "Testing dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw test
	@echo "✅ All tests passed"

dev-gateway: ## Run gateway in Quarkus dev mode (hot reload)
	@cd services/gateway && ./mvnw quarkus:dev

dev-auth: ## Run dummy auth in Quarkus dev mode (hot reload)
	@cd services/dummy/gw_auth && ./mvnw quarkus:dev
