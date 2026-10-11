#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Building MedSync C++ IPC Engine ==="
cd "$PROJECT_ROOT/cpp"

if command -v /ucrt64/bin/g++ &> /dev/null; then
    export PATH=/ucrt64/bin:/usr/bin:$PATH
fi

make clean || true
make -j4
echo "=== Build Succeeded! Executable: $(ls medsync_sim* 2>/dev/null) ==="
