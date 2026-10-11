# MedSync System V IPC Design & Concurrency Specification

## 1. Shared Memory (`sys/shm.h`)

### 1.1 Key & Permissions
- Key: `0x1234` (`SHM_KEY_DEFAULT`)
- Permissions: `0666` (User & Group read/write)
- Creation Flag: `IPC_CREAT | IPC_EXCL | 0666` with automated stale segment cleanup.

### 1.2 Layout Constraints
Shared memory is mapped identically into the virtual address spaces of all child processes via `shmat(shmid, NULL, 0)`.
To prevent segfaults and memory corruption:
- No heap-allocated pointers (`void*`, `char*`).
- No C++ dynamic standard library containers (`std::vector`, `std::string`, `std::map`).
- Fixed-width primitives (`int32_t`, `int64_t`, `uint32_t`, `char[N]`).
- Structure validation via `MEDSYNC_MAGIC` (`0x4D454453`) and `MEDSYNC_SCHEMA_VERSION` (1).

```cpp
struct SharedRegistry {
    uint32_t magic;
    uint32_t schema_version;
    int32_t simulation_status;
    uint64_t version_counter;
    int64_t start_time_epoch_ms;
    uint32_t uptime_seconds;
    uint32_t total_messages_processed;
    uint32_t total_alerts_generated;
    uint32_t total_assignments_made;
    uint32_t total_synchronization_errors;
    uint32_t patient_count;
    PatientRecord patients[MAX_PATIENTS];
    uint32_t doctor_count;
    DoctorRecord doctors[MAX_DOCTORS];
    uint32_t worker_count;
    WorkerRecord workers[MAX_WORKERS];
    RaceLabSharedState race_state;
};
```

---

## 2. System V Semaphores (`sys/sem.h`)

### 2.1 Semaphore Set Architecture
- Key: `0x1235` (`SEM_KEY_DEFAULT`)
- Set Size: 3 semaphores (`SEM_COUNT = 3`)
  - Index 0: `SEM_REGISTRY_MUTEX`
  - Index 1: `SEM_EVENT_MUTEX`
  - Index 2: `SEM_RACE_MUTEX`

### 2.2 P / V Operations & Kernel Recovery
- **P Operation (Wait / Lock)**:
  `sembuf.sem_op = -1`
  `sembuf.sem_flg = SEM_UNDO`
- **V Operation (Signal / Unlock)**:
  `sembuf.sem_op = 1`
  `sembuf.sem_flg = SEM_UNDO`

### 2.3 SEM_UNDO Invariant & Recovery Policy
`SEM_UNDO` ensures the Linux kernel maintains a per-process semaphore undo structure (`sem_undo`). If an unhandled `SIGSEGV` or `kill -9` abruptly terminates a worker while holding the lock, the kernel automatically resets the semaphore value to 1, preventing permanent deadlock across remaining workers.
*Important Architectural Note:* While `SEM_UNDO` guarantees semaphore liveness, it does not rollback partially written memory fields; the application level must complete updates atomically before releasing the lock.

---

## 3. System V Message Queues (`sys/msg.h`)

### 3.1 Key & Structure
- Key: `0x1236` (`MSG_KEY_DEFAULT`)
- Message Envelope:
```cpp
struct IpcMessageBuffer {
    long mtype;                       // Channel target identifier
    EmergencyMessagePayload payload; // Fixed-size payload
};
```

### 3.2 Channel Routing
- Channel 1: `MSG_EMERGENCY_ALERT` — broadcast by Patient Monitor to Dispatcher.
- Channels 11 to 14: `MSG_ASSIGNMENT_REQUEST` — directed to specific doctor worker instances (where channel = 10 + doctor_id).
- Channel 3: `MSG_ASSIGNMENT_ACK` — doctor confirmation of claim.
- Channel 4: `MSG_STATUS_UPDATE` — lifecycle transition to `IN_TREATMENT` or `COMPLETED`.
- Channel 99: `MSG_SHUTDOWN` — broadcast teardown order.

---

## 4. Race Condition Lab Theoretical Formalization

### 4.1 Time-of-Check to Time-of-Use (TOCTOU)
Let $P$ be a patient record, with state $S_P \in \{\text{WAITING}, \text{ASSIGNED}, \text{COMPLETED}\}$.
In an unsynchronized system:
$$\text{Worker}_1: \text{Check}(S_P = \text{WAITING}) \implies \text{True}$$
$$\text{Worker}_2: \text{Check}(S_P = \text{WAITING}) \implies \text{True}$$
$$\text{Worker}_1: \text{Write}(S_P \leftarrow \text{ASSIGNED}, D_P \leftarrow 1)$$
$$\text{Worker}_2: \text{Write}(S_P \leftarrow \text{ASSIGNED}, D_P \leftarrow 2)$$
Invariant violated: Two distinct doctors believe they have exclusive ownership of the emergency procedure.

In Protected Mode with Mutex $M$:
$$[ \text{Wait}(M) \to \text{Check}(S_P = \text{WAITING}) \to \text{Write}(S_P \leftarrow \text{ASSIGNED}) \to \text{Signal}(M) ]$$
Worker 2 observes $S_P = \text{ASSIGNED}$, receives conflict code, and aborts duplicate claim.
