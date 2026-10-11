#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  MedSync — Linux / Ubuntu Dependency Setup Script"
echo "=========================================================="

# Update and install build essentials & Python dependencies
if command -v apt-get &> /dev/null; then
    echo "[+] Updating apt repositories..."
    sudo apt-get update -y
    echo "[+] Installing g++, make, python3, pip, nodejs, npm..."
    sudo apt-get install -y build-essential g++ make python3 python3-pip nodejs npm
fi

# Python dependencies
echo "[+] Installing Python backend requirements..."
python3 -m pip install --upgrade pip
python3 -m pip install fastapi uvicorn websockets pydantic

# Frontend dependencies
echo "[+] Installing Next.js frontend dependencies..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../frontend"
npm install

echo "=========================================================="
echo "  [SUCCESS] All MedSync dependencies installed cleanly!"
echo "  Run ./scripts/build.sh to compile the C++ IPC engine."
echo "=========================================================="
