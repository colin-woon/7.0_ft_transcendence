package = 
# $(1) is the command name for the error message
define check_package
	@if [ -z "$(package)" ]; then \
		echo "-------------------------------------------------------"; \
		echo "❌ ERROR: No package specified."; \
		echo "Usage:   make $(1) package=<name>"; \
		echo "Example: make $(1) package=hibernate-orm-panache"; \
		echo "-------------------------------------------------------"; \
		exit 1; \
	fi
endef

# Ensure commands run even if a file named 'dev' exists
.PHONY: dev lint format build setup add remove list clean

# Default command when you just type 'make'
all: dev

dev:
	quarkus dev

lint:
	mvn spotless:check

format:
	mvn spotless:apply

build:
	quarkus build

setup:
	curl -s "https://get.sdkman.io" | bash
	sdk env install
	sdk env
	quarkus --version
	java -version

add: 
	$(call check_package,add)
	quarkus ext add $(package)

remove:
	$(call check_package,remove)
	quarkus ext remove $(package)

list:
	quarkus ext list

clean:
	mvn clean