package = 
# $(1) is the command name for the error message
define check_package
	@if [ -z "$(package)" ]; then \
		echo "-------------------------------------------------------"; \
		echo "❌ ERROR: No package specified."; \
		echo "Usage:   make $(1) package=<name>"; \
		echo "Example: make $(1) package=react"; \
		echo "-------------------------------------------------------"; \
		exit 1; \
	fi
endef

# Ensure commands run even if a file named 'dev' exists
.PHONY: dev lint format build setup add add-dev remove remove-dev start list

# Default command when you just type 'make'
all: dev

dev:
	npm run dev

start:
	npm run start

lint:
	npm run lint

format:
	npm run format

build:
	npm run build

setup:
	export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	nvm use && npm install

add: 
	$(call check_package,add)
	npm install $(package)

add-dev:
	$(call check_package,add-dev)
	npm install --save-dev $(package)

remove:
	$(call check_package,remove)
	npm uninstall $(package)

remove-dev:
	$(call check_package,remove-dev)
	npm uninstall --save-dev $(package)

list:
	npm list