#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Cleaning MedSync Artifacts ==="
cd "$PROJECT_ROOT/cpp"
rm -f src/*.o medsync_sim medsync_sim.exe medsync_audit.log tests/diag_ipc tests/diag_ipc.exe

# On Linux, unlink any orphaned System V IPC objects using ipcrm if keys exist
if command -v ipcrm &> /dev/null; then
    echo "[+] Unlinking any dangling System V IPC keys..."
    ipcrm -M 0x1234 2>/dev/null || true
    ipcrm -S 0x1235 2>/dev/null || true
    ipcrm -Q 0x1236 2>/dev/null || true
    ipcrm -M 0x2234 2>/dev/null || true
    ipcrm -S 0x2235 2>/dev/null || true
fi

echo "=== Clean Complete ==="
