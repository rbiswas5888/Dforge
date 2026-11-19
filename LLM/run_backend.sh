#!/usr/bin/env bash
# DF-UX Intelligence FastAPI Server Launcher
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "⚡ Starting DF-UX Intelligence Backend on http://127.0.0.1:8000 ..."
PYTHONPATH=. ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
