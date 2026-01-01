#!/bin/bash
# Production build script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building Filings Frontend for Production..."
echo "============================================"

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$PROJECT_DIR"
uv sync

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

echo "Building frontend..."
npm run build

echo ""
echo "Build complete!"
echo "  Frontend dist: $PROJECT_DIR/frontend/dist"
echo ""
echo "To run in production:"
echo "  cd $PROJECT_DIR"
echo "  uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000"
