# MedSync Architecture & Systems Design

## 1. High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                           NEXT.JS DASHBOARD FRONTEND                              |
|   (Dark Navy #0B1020, Recharts, Space Grotesk / Inter / JetBrains Mono, Tailwind) |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | WebSocket (ws://localhost:8000/ws)
                                         | REST API (http://localhost:8000/api)
                                         v
+-----------------------------------------------------------------------------------+
|                        PYTHON FASTAPI EVENT ORCHESTRATOR                          |
|   (Subprocess Lifecycle Supervisor, NDJSON Stream Bridge, WebSocket Broadcaster)  |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | Subprocess Pipe (stdout / stdin / signals)
                                         v
+-----------------------------------------------------------------------------------+
|                       MEDSYNC C++17 MULTI-PROCESS IPC ENGINE                      |
|                                                                                   |
|  +--------------------+        +---------------------+      +------------------+  |
|  |  Main Controller   | fork() |   Patient Monitor   |      | Emergency        |  |
|  |  (Supervisor /     |------->|   (Stochastic Vitals|----->| Dispatcher       |  |
|  |   Lifecycle Owner) |        |    & Alert Detect)  |      | (Priority Triage)|  |
|  +--------------------+        +---------------------+      +------------------+  |
|            |                              |                           |           |
|            | fork()                       | msgsnd()                  | msgsnd()  |
|            v                              v                           v           |
|  +-----------------------------------------------------------------------------+  |
|  |                    SYSTEM V MESSAGE QUEUE (msgget / msgsnd)                 |  |
|  |   - MSG_EMERGENCY_ALERT (Channel 1)                                         |  |
|  |   - MSG_ASSIGNMENT_REQUEST (Channels 11-14, directed to doctor workers)    |  |
|  |   - MSG_STATUS_UPDATE / MSG_AUDIT_EVENT (Channel 3 & 4)                     |  |
|  +-----------------------------------------------------------------------------+  |
|                                           ^                           ^           |
|                                  msgrcv() |                  msgrcv() |           |
|                                           v                           v           |
|  +--------------------+        +---------------------+      +------------------+  |
|  |  Audit Logger      |        |   Doctor Worker #1  |      | Doctor Worker #2 |  |
|  |  (Audit Trail Disk |        |   (Clinical Tx &    | ...  | (Clinical Tx &   |  |
|  |   medsync_audit.log|        |    Stabilization)   |      |  Stabilization)  |  |
|  +--------------------+        +---------------------+      +------------------+  |
|            |                              |                           |           |
|            +------------------------------+---------------------------+           |
|                                           |                                       |
|                                           v                                       |
|  +=============================================================================+  |
|  |                   SYSTEM V SHARED MEMORY (shmget / shmat)                   |  |
|  |                                                                             |  |
|  |   - Magic: 0x4D454453 ("MEDS")      - Schema Version: 1                     |  |
|  |   - Version Counter (Atomic Seq)    - System Uptime & Simulation Status     |  |
|  |   - Patient Registry (8-10 fixed records: Vitals, Priority, Assigned Doc)   |  |
|  |   - Doctor Registry (4 records: Status, Assigned Patient, Treated Count)    |  |
|  |   - Worker Process Registry (Roles, real PIDs, lock counts, msg counts)     |  |
|  |   - Race Lab Shared Test Region (Lost Counter, Invariant Barriers)          |  |
|  +=============================================================================+  |
|                                           ^                                       |
|                                           | semop() P/V Operations (SEM_UNDO)     |
|  +=============================================================================+  |
|  |                  SYSTEM V SEMAPHORE SET (semget / semop)                    |  |
|  |                                                                             |  |
|  |   - Index 0: SEM_REGISTRY_MUTEX (Guards Patient & Doctor arrays)            |  |
|  |   - Index 1: SEM_EVENT_MUTEX    (Guards Sequence & Metric counters)         |  |
|  |   - Index 2: SEM_RACE_MUTEX     (Guards Race Condition Lab Protected Mode)  |  |
|  +=============================================================================+  |
+-----------------------------------------------------------------------------------+
```

## 2. Process Roles and Synchronization Contracts

1. **Main Controller**:
   - Initializer and owner of IPC resource lifecycle (`shmget`, `semget`, `msgget`).
   - Seeds patient registry and doctor records before any worker spawns.
   - Creates independent worker processes via `fork()`.
   - Reaps terminated children with `waitpid(..., WNOHANG)`.
   - On shutdown, detaches shared memory (`shmdt`), unlinks segments (`shmctl(IPC_RMID)`), and releases semaphores and queues.

2. **Patient Monitor**:
   - Periodically samples stochastic vitals for 8 monitored emergency patients.
   - Evaluates physiological thresholds (SpO2 <= 89%, HR >= 135 bpm, SBP >= 185 mmHg).
   - Enters `SEM_REGISTRY_MUTEX` critical section to update patient priority and mark alert active.
   - Dispatches typed `MSG_EMERGENCY_ALERT` to the message queue.

3. **Emergency Dispatcher**:
   - Consumes emergency messages from the queue.
   - Triage policy: P1 (Critical) > P2 (High) > P3 (Medium) > P4 (Low).
   - Atomically identifies first available physician under `SEM_REGISTRY_MUTEX`.
   - Updates patient state to `STATUS_ASSIGNED` and physician state to `DOC_BUSY`.
   - Routes `MSG_ASSIGNMENT_REQUEST` to the specific physician's channel (`10 + doc_id`).

4. **Doctor Workers (1 to 4)**:
   - Independent processes monitoring private message queue channels.
   - Verifies assignment invariant under `SEM_REGISTRY_MUTEX`.
   - Advances patient status: `STATUS_ASSIGNED` -> `STATUS_IN_TREATMENT`.
   - Simulates procedure duration.
   - Re-enters semaphore critical section to normalize vitals (HR ~ 75, SpO2 ~ 99%) and discharge (`STATUS_COMPLETED`).
   - Increments treated count and returns doctor status to `DOC_AVAILABLE`.

5. **Audit Logger**:
   - Consumes audit events.
   - Writes immutable log entries with timestamps, PIDs, event types, patient IDs, and results to `medsync_audit.log`.
