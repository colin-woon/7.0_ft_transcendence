.PHONY: help
help: ## Show this help message
	@echo "bumIntra - Microservices Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build-java
build-java: ## Build all Java services (gateway, dummy auth)
	@echo "Building gateway service..."
	@cd services/gateway && ./mvnw package -DskipTests
	@echo "Building dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw package -DskipTests
	@echo "✅ Java services built successfully"

.PHONY: build-gateway
build-gateway: ## Build only gateway service
	@echo "Building gateway service..."
	@cd services/gateway && ./mvnw package -DskipTests
	@echo "✅ Gateway built successfully"

.PHONY: build-auth
build-auth: ## Build only dummy auth service
	@echo "Building dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw package -DskipTests
	@echo "✅ Dummy auth built successfully"

.PHONY: clean-java
clean-java: ## Clean all Java build artifacts
	@echo "Cleaning gateway..."
	@cd services/gateway && ./mvnw clean
	@echo "Cleaning dummy auth..."
	@cd services/dummy/gw_auth && ./mvnw clean
	@echo "✅ Java artifacts cleaned"

.PHONY: build
build: build-java ## Build all services
	@echo "✅ All services ready for Docker"

.PHONY: up
up: build-java ## Build Java services and start all containers
	docker compose up --build

.PHONY: up-d
up-d: build-java ## Build Java services and start all containers in detached mode
	docker compose up --build -d

.PHONY: down
down: ## Stop and remove all containers
	docker compose down

.PHONY: restart
restart: down up ## Restart all services

.PHONY: logs
logs: ## View logs from all services
	docker compose logs -f

.PHONY: logs-gateway
logs-gateway: ## View logs from gateway service
	docker compose logs -f gateway_service

.PHONY: logs-auth
logs-auth: ## View logs from dummy auth service
	docker compose logs -f gw_auth_service

.PHONY: ps
ps: ## Show running containers
	docker compose ps

.PHONY: clean
clean: down clean-java ## Stop containers and clean build artifacts
	@echo "✅ Clean complete"

.PHONY: rebuild
rebuild: clean build up ## Full rebuild and restart

.PHONY: rebuild-gateway
rebuild-gateway: build-gateway ## Rebuild and restart only gateway service
	docker compose up --build -d gateway_service

.PHONY: rebuild-auth
rebuild-auth: build-auth ## Rebuild and restart only dummy auth service
	docker compose up --build -d gw_auth_service

.PHONY: shell-gateway
shell-gateway: ## Open shell in gateway container
	docker exec -it gateway_service /bin/bash

.PHONY: shell-auth
shell-auth: ## Open shell in dummy auth container
	docker exec -it gw_auth_service /bin/bash

.PHONY: test-java
test-java: ## Run tests for all Java services
	@echo "Testing gateway service..."
	@cd services/gateway && ./mvnw test
	@echo "Testing dummy auth service..."
	@cd services/dummy/gw_auth && ./mvnw test
	@echo "✅ All tests passed"

.PHONY: dev-gateway
dev-gateway: ## Run gateway in Quarkus dev mode (hot reload)
	@cd services/gateway && ./mvnw quarkus:dev

.PHONY: dev-auth
dev-auth: ## Run dummy auth in Quarkus dev mode (hot reload)
	@cd services/dummy/gw_auth && ./mvnw quarkus:dev

.DEFAULT_GOAL := help
