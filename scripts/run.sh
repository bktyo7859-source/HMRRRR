#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================================="
echo "  Launching MedSync — Real-Time IPC Hospital Command Center"
echo "=========================================================="

# 1. Build C++ engine if missing
if [ ! -f "$PROJECT_ROOT/cpp/medsync_sim" ] && [ ! -f "$PROJECT_ROOT/cpp/medsync_sim.exe" ]; then
    echo "[+] Compiling C++ IPC Engine..."
    "$SCRIPT_DIR/build.sh"
fi

# 2. Start FastAPI Backend in background
echo "[+] Starting FastAPI Orchestrator (port 8000)..."
cd "$PROJECT_ROOT"
python3 -m uvicorn backend.app.main:app --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Trap signals for graceful shutdown of background services
cleanup() {
    echo ""
    echo "[!] Shutting down MedSync services..."
    kill "$BACKEND_PID" 2>/dev/null || true
    echo "[✓] Teardown complete."
    exit 0
}
trap cleanup SIGINT SIGTERM

# 3. Start Next.js Frontend
echo "[+] Starting Next.js Command Center (port 3000)..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --port 3000
