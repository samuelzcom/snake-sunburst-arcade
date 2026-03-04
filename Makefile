SHELL := /usr/bin/env bash
.PHONY: help dev lint typecheck test build validate deploy

.DEFAULT_GOAL := help

PACKAGE_MANAGER := $(shell node -e "const fs = require('fs'); try { const p = JSON.parse(fs.readFileSync('./package.json', 'utf8')); process.stdout.write((p.packageManager || 'npm').split('@')[0]); } catch (e) { process.stdout.write('npm'); }")

define script_has
$(shell node -e "const fs = require('fs'); try { const p = JSON.parse(fs.readFileSync('./package.json', 'utf8')); const s = p.scripts || {}; process.stdout.write(s['$(1)'] ? '1' : '0'); } catch (e) { process.stdout.write('0'); }")
endef

help:
	@echo "Targets: dev lint typecheck test build validate deploy"

# Run project-specific package script if available.
dev:
	@if [ "$(call script_has,dev)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run dev; \
	else \
	  echo "No dev script configured in package.json." >&2; \
	  exit 1; \
	fi

lint:
	@if [ "$(call script_has,lint)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run lint; \
	else \
	  echo "No lint script configured in package.json." >&2; \
	  exit 1; \
	fi

typecheck:
	@if [ "$(call script_has,typecheck)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run typecheck; \
	else \
	  echo "No typecheck script configured in package.json." >&2; \
	  exit 1; \
	fi

test:
	@if [ "$(call script_has,test)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run test; \
	elif [ "$(call script_has,test:unit)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run test:unit; \
	elif [ "$(call script_has,test:watch)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run test:watch; \
	elif [ "$(call script_has,test:playwright)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run test:playwright; \
	elif [ "$(call script_has,test:ui)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run test:ui; \
	else \
	  echo "No test command found." >&2; \
	  echo "Try one of: test, test:unit, test:watch, test:playwright, test:ui" >&2; \
	  exit 1; \
	fi

build:
	@if [ "$(call script_has,build)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run build; \
	else \
	  $(PACKAGE_MANAGER) exec astro build || { \
	    echo "No build command found (build script or astro CLI)." >&2; \
	    exit 1; \
	  }; \
	fi

validate: lint typecheck test build
	@echo "Validation completed successfully."

deploy:
	@if [ "$(call script_has,deploy)" = "1" ]; then \
	  $(PACKAGE_MANAGER) run deploy; \
	else \
	  echo "No deploy script configured in package.json." >&2; \
	  exit 1; \
	fi
