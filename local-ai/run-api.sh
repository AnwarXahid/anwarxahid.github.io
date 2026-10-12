#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
exec .venv/bin/uvicorn service:app --host 127.0.0.1 --port 8000 --no-access-log
