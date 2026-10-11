# MedSync — IPC-Based Smart Hospital Emergency Coordination System

[![OS](https://img.shields.io/badge/OS-Linux%20%2F%20Ubuntu-orange)](https://ubuntu.com)
[![C++](https://img.shields.io/badge/C++-17%20Strict-blue)](https://isocpp.org)
[![IPC](https://img.shields.io/badge/IPC-System%20V%20(SHM%20%7C%20SEM%20%7C%20MSG)-red)](docs/ipc_design.md)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2F%20WebSocket-teal)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%2F%20Tailwind%204-black)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20PASS-brightgreen)](tests/test_medsync.py)

**MedSync** is a fourth-year Operating Systems capstone project implementing a real-time, multi-process emergency coordination system. The system demonstrates operating-system-level Inter-Process Communication (IPC), process synchronization, race conditions, and their mathematical correction using System V primitives in C++17.

---

## 🌟 Key Features

1. **True Multi-Process Hierarchy (`fork()`)**:
   - **Main Controller**: Supervisor process owning shared memory, semaphores, and message queue lifecycles.
   - **Patient Monitor**: Periodically drifts fictional patient vitals, detects physiological thresholds, and sends typed System V alerts.
   - **Emergency Dispatcher**: Prioritizes emergency messages (P1 $\to$ P4) and atomically assigns available doctors.
   - **Doctor Workers (1-4)**: Independent physician processes transitioning patient status through `ASSIGNED` $\to$ `IN_TREATMENT` $\to$ `COMPLETED`.
   - **Audit Logger**: Consumes audit events and records persistent forensic logs to `medsync_audit.log`.

2. **System V IPC Architecture**:
   - **Shared Memory (`shmget`, `shmat`, `shmdt`, `shmctl`)**: Contiguous fixed-layout `SharedRegistry` storing patients, doctors, and real worker PIDs. Zero-copy access without dynamic containers or raw heap pointers.
   - **Semaphores (`semget`, `semop`, `semctl`)**: 3-semaphore set (`SEM_REGISTRY_MUTEX`, `SEM_EVENT_MUTEX`, `SEM_RACE_MUTEX`) with `SEM_UNDO` kernel recovery.
   - **Message Queues (`msgget`, `msgsnd`, `msgrcv`, `msgctl`)**: Typed channels (`mtype`) routing emergency alerts and targeted assignments.

3. **Signature Race Condition Laboratory**:
   - **Experiment 1 (Duplicate Patient Claim)**: Exposes Time-of-Check to Time-of-Use (TOCTOU) races in Unsafe Mode (both doctors claim same patient) vs Protected Mode (mutex enforces single claim).
   - **Experiment 2 (Lost-Update Counter)**: Concurrently executes 20,000 increments. Demonstrates empirical loss in Unsafe Mode (~8,400 lost increments) vs 100% exact 20,000 match in Protected Mode.
   - **Experiment 3 (Conflicting Status Transitions)**: Conflicting state machine transitions rejected by semaphore-guarded checks.

4. **Premium Monochromatic Glassmorphism UI**:
   - Two-shade grey frosted glass aesthetic: Dark smoke (`rgba(38, 40, 43, 0.66)`), light smoke silver (`rgba(211, 214, 218, 0.12)`), deep charcoal (`#101113`), and silver glass highlights (`rgba(230, 233, 237, 0.15)`).
   - Space Grotesk metrics, Inter UI text, JetBrains Mono terminal logs.
   - 11 interactive views: Overview, Doctors & Specialists, Doctor Attendance Registry, Live Patients, Emergency Queue, Process Monitor, IPC Inspector, Race Condition Lab, Analytics, Event Logs, System Settings, Documentation.
   - Real-time updates via WebSockets with automatic fallback polling.

---

## 📁 Project Structure

```
clg os ipc/
├── cpp/                           # Core C++17 IPC Simulation Engine
│   ├── include/
│   │   ├── common.h               # SharedRegistry, fixed structures, enums
│   │   ├── ipc_shared_memory.h    # System V Shared Memory Manager
│   │   ├── ipc_semaphore.h        # System V Semaphore Manager & RAII Guard
│   │   ├── ipc_message_queue.h    # System V Message Queue Manager
│   │   ├── controller.h           # Supervisor lifecycle & fork coordinator
│   │   ├── patient_monitor.h      # Vitals generator & alert detector
│   │   ├── dispatcher.h           # Triage router & doctor assignment
│   │   ├── doctor_worker.h        # Autonomous physician treatment routine
│   │   ├── audit_logger.h         # Persistent audit disk logger
│   │   └── race_lab.h             # Concurrency experiments 1, 2, & 3
│   ├── src/                       # Implementation files
│   └── Makefile                   # Strict C++17 compilation rules
├── backend/                       # Python FastAPI Orchestration Layer
│   └── app/
│       ├── main.py                # REST endpoints & WebSocket broadcaster
│       ├── process_manager.py     # Subprocess supervisor & NDJSON pipe bridge
│       └── schemas.py             # Pydantic request/response schemas
├── frontend/                      # Next.js 16 + Tailwind CSS 4 Command Center
│   ├── src/
│   │   ├── app/                   # App Router pages and layout
│   │   ├── components/            # Header, Sidebar, and 10 Tab Views
│   │   ├── hooks/                 # WebSocket live stream hook
│   │   └── lib/                   # API client and TypeScript definitions
├── tests/
│   └── test_medsync.py            # Automated integration & race test suite
├── docs/
│   ├── architecture.md            # Topology diagrams & process contracts
│   ├── ipc_design.md              # System V IPC technical specification
│   ├── report.md                  # Formal 17-section Academic Project Report
│   ├── test_results.md            # Benchmark logs and verification matrix
│   └── viva_questions.md          # 26 comprehensive viva questions & answers
├── scripts/
│   ├── setup.sh                   # Ubuntu / Linux dependencies installer
│   ├── build.sh                   # C++ compilation script
│   ├── build.bat                  # Windows native compiler script
│   ├── run.sh                     # Full stack runner script
│   └── clean.sh                   # Artifact and IPC cleanup script
├── Dockerfile                     # Isolated Ubuntu 22.04 container
├── docker-compose.yml             # Single-command Docker Compose setup
└── README.md
```

---

## 🚀 Quick Start Guide

### Option 1: Native Windows (Current Workspace)

1. **Compile C++ IPC Engine**:
   ```cmd
   cmd.exe /c "scripts\build.bat"
   ```

2. **Start FastAPI Orchestrator** (Port 8000):
   ```powershell
   python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1
   ```

3. **Start Next.js Dashboard** (Port 3000):
   ```powershell
   cd frontend
   npm run dev -- --port 3000
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option 2: Linux / Ubuntu

1. **Install Prerequisites**:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/setup.sh
   ```

2. **Build and Run**:
   ```bash
   ./scripts/run.sh
   ```

---

### Option 3: Docker (Isolated Linux Container)

```bash
docker compose up --build
```
Access the dashboard at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Automated Testing

Run the automated test suite verifying IPC initialization, race condition detection, and mutual exclusion correctness:

```bash
python tests/test_medsync.py
```
**Output**:
```
..........
----------------------------------------------------------------------
Ran 10 tests in 0.228s

OK
```

---

## 📊 Race Condition Lab Benchmarks

| Metric | Unsafe Mode | Protected Mode | Improvement |
| :--- | :--- | :--- | :--- |
| **Duplicate Patient Claims** | 2 Doctors Claimed Same Patient | Exactly 1 Doctor Claimed | Mutual Exclusion Enforced |
| **Counter Increments** | 11,588 / 20,000 | 20,000 / 20,000 | **0 Lost Updates** |
| **Data Loss Ratio** | ~42.0% Lost Increments | 0.0% Lost Increments | **100% Precision** |
| **Duration** | 0.57 ms | 35.62 ms | Shows semaphore cost |

---

## 🎓 Academic Defense & Viva Voce

- **Project Report**: See [`docs/report.md`](docs/report.md) for the complete 17-section report.
- **Viva Voce Prep**: Review [`docs/viva_questions.md`](docs/viva_questions.md) for 26 questions covering Coffman conditions, `SEM_UNDO`, virtual memory isolation, and TOCTOU races.
