# LeadFi CRM - Makefile for Testing and Deployment

.PHONY: help test test-report deploy dry-run clean install

# Default target
help:
	@echo "LeadFi CRM - Available Commands"
	@echo "================================="
	@echo "test        - Run comprehensive test suite"
	@echo "test-report - Generate deployment readiness report"
	@echo "deploy      - Deploy to Railway (with tests)"
	@echo "dry-run     - Test deployment without deploying"
	@echo "install     - Install all dependencies"
	@echo "clean       - Clean up temporary files"
	@echo "help        - Show this help message"

# Run comprehensive tests
test:
	@echo "🧪 Running comprehensive test suite..."
	python scripts/run_tests.py

# Generate test report
test-report:
	@echo "📊 Generating deployment readiness report..."
	python scripts/run_tests.py --report

# Deploy to Railway
deploy:
	@echo "🚀 Deploying to Railway..."
	python scripts/deploy_to_railway.py

# Dry run (test only)
dry-run:
	@echo "🔍 Running deployment dry run..."
	python scripts/deploy_to_railway.py --dry-run

# Install dependencies
install:
	@echo "📦 Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "📦 Installing Node.js dependencies..."
	cd frontend && npm install

# Clean up temporary files
clean:
	@echo "🧹 Cleaning up temporary files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type f -name "test_results.json" -delete
	find . -type f -name "deployment_log.txt" -delete
	@echo "✅ Cleanup complete"

# Quick test (just API tests)
test-api:
	@echo "🔧 Running API tests..."
	python -m unittest tests.test_api

# Quick test (just database tests)
test-db:
	@echo "🗄️ Running database tests..."
	python -m unittest tests.test_database

# Quick test (just frontend tests)
test-frontend:
	@echo "🎨 Running frontend tests..."
	python -m unittest tests.test_frontend

# Build frontend only
build-frontend:
	@echo "🏗️ Building frontend..."
	cd frontend && npm run build

# Start local development
dev:
	@echo "🚀 Starting local development server..."
	python test_local.py 