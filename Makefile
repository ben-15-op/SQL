# ──────────────────────────────────────────────────────────
#  MiniSQL — Makefile
#  Automates installation, running, testing, and cleanup
# ──────────────────────────────────────────────────────────

PYTHON     ?= python
PIP        ?= pip
NPM        ?= npm
UVICORN    ?= $(PYTHON) -m uvicorn
PYTEST     ?= $(PYTHON) -m pytest
BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8000
UI_DIR     = ui

# ── Install ──────────────────────────────────────────────

.PHONY: install install-backend install-frontend

install: install-backend install-frontend  ## Install all dependencies (Python + Node)

install-backend:  ## Install Python dependencies
	$(PIP) install -r requirements.txt

install-frontend:  ## Install Node.js frontend dependencies
	cd $(UI_DIR) && $(NPM) install

# ── Run ──────────────────────────────────────────────────

.PHONY: backend frontend run build

backend:  ## Start the FastAPI backend server (port 8000)
	$(UVICORN) api:app --host $(BACKEND_HOST) --port $(BACKEND_PORT) --reload

frontend:  ## Start the Vite frontend dev server
	cd $(UI_DIR) && $(NPM) run dev

run:  ## Start both backend and frontend (Windows)
	start "MiniSQL Backend" cmd /k "$(PYTHON) -m uvicorn api:app --host $(BACKEND_HOST) --port $(BACKEND_PORT) --reload"
	cd $(UI_DIR) && start "MiniSQL Frontend" cmd /k "$(NPM) run dev"

build:  ## Build the frontend for production
	cd $(UI_DIR) && $(NPM) run build

# ── Test ─────────────────────────────────────────────────

.PHONY: test test-lexer test-parser test-semantic test-logical test-optimizer test-pipeline test-joins test-storage test-integrity

test:  ## Run ALL tests
	$(PYTEST) test_*.py -v

test-lexer:  ## Run lexer tests
	$(PYTEST) test_lexer.py -v

test-parser:  ## Run parser tests
	$(PYTEST) test_parser.py -v

test-semantic:  ## Run semantic analyzer tests
	$(PYTEST) test_semantic.py -v

test-logical:  ## Run logical plan tests
	$(PYTEST) test_logical.py -v

test-optimizer:  ## Run optimizer tests
	$(PYTEST) test_optimizer.py -v

test-pipeline:  ## Run full pipeline tests
	$(PYTEST) test_fullpipeline.py -v

test-joins:  ## Run join tests
	$(PYTEST) test_joins.py -v

test-storage:  ## Run storage layer tests
	$(PYTEST) test_storage.py -v

test-integrity:  ## Run integrity constraint tests
	$(PYTEST) test_integrity.py -v

# ── Clean ────────────────────────────────────────────────

.PHONY: clean clean-py clean-build

clean: clean-py clean-build  ## Remove all generated/cached files

clean-py:  ## Remove Python caches
	-@if exist __pycache__ rmdir /s /q __pycache__
	-@if exist lexer\__pycache__ rmdir /s /q lexer\__pycache__
	-@if exist parser\__pycache__ rmdir /s /q parser\__pycache__
	-@if exist semantic\__pycache__ rmdir /s /q semantic\__pycache__
	-@if exist logical\__pycache__ rmdir /s /q logical\__pycache__
	-@if exist planner\__pycache__ rmdir /s /q planner\__pycache__
	-@if exist execution\__pycache__ rmdir /s /q execution\__pycache__
	-@if exist storage\__pycache__ rmdir /s /q storage\__pycache__
	-@if exist utils\__pycache__ rmdir /s /q utils\__pycache__
	-@if exist .pytest_cache rmdir /s /q .pytest_cache

clean-build:  ## Remove legacy build artifacts
	-@if exist build\query.c del /q build\query.c
	-@if exist build\query.s del /q build\query.s
	-@if exist build\query_exec.exe del /q build\query_exec.exe
	-@if exist catalog_temp.json del /q catalog_temp.json
	-@if exist out.txt del /q out.txt
	-@if exist err.txt del /q err.txt

# ── Help ─────────────────────────────────────────────────

.PHONY: help

help:  ## Show this help message
	@echo.
	@echo  MiniSQL — Available targets:
	@echo  ────────────────────────────
	@echo   make install          Install all dependencies
	@echo   make install-backend  Install Python dependencies
	@echo   make install-frontend Install Node.js dependencies
	@echo   make backend          Start FastAPI server (port 8000)
	@echo   make frontend         Start Vite dev server
	@echo   make run              Start both servers (Windows)
	@echo   make build            Build frontend for production
	@echo   make test             Run all tests
	@echo   make test-lexer       Run lexer tests only
	@echo   make test-parser      Run parser tests only
	@echo   make test-semantic    Run semantic tests only
	@echo   make test-logical     Run logical plan tests only
	@echo   make test-optimizer   Run optimizer tests only
	@echo   make test-pipeline    Run full pipeline tests only
	@echo   make test-joins       Run join tests only
	@echo   make test-storage     Run storage tests only
	@echo   make test-integrity   Run integrity tests only
	@echo   make clean            Remove caches and build artifacts
	@echo   make help             Show this help message
	@echo.
