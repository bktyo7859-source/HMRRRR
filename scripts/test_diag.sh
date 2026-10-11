#!/usr/bin/env bash
export PATH=/usr/bin:/bin:$PATH
gcc tests/diag_ipc.c -o tests/diag_ipc.exe
./tests/diag_ipc.exe
