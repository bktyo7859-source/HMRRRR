# MedSync — Viva Voce Questions & Technical Answers
**Prepared for B.Tech / B.E. Final-Year Operating Systems Project Defense**

---

### Q1: What is Inter-Process Communication (IPC), and why is it necessary?
**Answer:** IPC provides mechanisms allowing independent processes running in separated virtual address spaces to exchange data and synchronize actions. Because the OS kernel enforces virtual memory protection to prevent one process from reading or corrupting another's memory, IPC primitives (shared memory, semaphores, message queues, pipes) are required for coordinated multi-process execution.

---

### Q2: What are the three primary System V IPC mechanisms used in MedSync?
**Answer:**
1. **Shared Memory (`sys/shm.h`)**: Maps a common physical RAM segment into processes' virtual address spaces for zero-copy data exchange.
2. **Semaphores (`sys/sem.h`)**: Kernel-managed counters supporting atomic test-and-set operations for mutual exclusion.
3. **Message Queues (`sys/msg.h`)**: Asynchronous, priority-tagged message-passing FIFO queues managed by the kernel.

---

### Q3: How does Shared Memory achieve higher throughput than Message Queues or Pipes?
**Answer:** Shared memory does not require copying data between user space and kernel space. Once attached via `shmat()`, processes read and write directly to physical memory at CPU bus speeds. Pipes and message queues require at least two context switches and two buffer copies (user $\to$ kernel $\to$ user) per transfer.

---

### Q4: Why must shared memory operations be synchronized using semaphores?
**Answer:** Because shared memory provides raw concurrent memory access without built-in mutual exclusion. If two processes write simultaneously, or one reads while another writes, race conditions, torn reads, and corrupted data structures occur. Semaphores enforce mutual exclusion around critical sections.

---

### Q5: What is a Race Condition, and what is a TOCTOU race?
**Answer:** A race condition occurs when program correctness depends on the non-deterministic scheduling and interleaving of threads or processes. A **Time-of-Check to Time-of-Use (TOCTOU)** race occurs when a process checks a condition (e.g., patient is `WAITING`), but another process modifies that condition before the first process acts upon its observation.

---

### Q6: How does Experiment 1 in MedSync demonstrate the TOCTOU race condition?
**Answer:** In Unsafe Mode, a coordinated barrier pauses both Doctor #1 and Doctor #2 after checking that Patient #1 is in `WAITING` status, but before either writes. Consequently, both workers observe `WAITING` and both write `ASSIGNED`, resulting in an invalid state where two doctors have claimed the same patient.

---

### Q7: How does Protected Mode resolve the duplicate claim race in Experiment 1?
**Answer:** In Protected Mode, the check and the write are placed inside an atomic critical section guarded by `SEM_REGISTRY_MUTEX`. The first doctor acquires the lock, checks `WAITING`, updates to `ASSIGNED`, and releases the lock. The second doctor acquires the lock next, observes `ASSIGNED`, detects a conflict, and safely aborts.

---

### Q8: What causes lost updates in Experiment 2 (Lost-Update Counter)?
**Answer:** Incrementing a variable (`counter++`) consists of three distinct CPU instructions:
1. `MOV EAX, [counter]` (Load into register)
2. `INC EAX` (Increment locally)
3. `MOV [counter], EAX` (Store back to memory)
When two processes execute this without synchronization, preemption between steps 1 and 3 causes one process to overwrite the other's increment, resulting in thousands of lost updates out of 20,000.

---

### Q9: Explain the role and significance of `SEM_UNDO` in `semop()`.
**Answer:** `SEM_UNDO` instructs the Linux kernel to record changes made to a semaphore by a process. If the process terminates abnormally (e.g., crash, `SIGSEGV`, `kill -9`), the kernel automatically reverts the process's semaphore adjustments. This prevents orphaned locks and permanent deadlocks in remaining processes.

---

### Q10: Does `SEM_UNDO` restore partially modified shared memory records?
**Answer:** **No.** `SEM_UNDO` only restores the integer value of the semaphore. It has no knowledge of application-level data structures in shared memory. If a process crashed midway through writing a patient record, that record remains partially modified. Application-level atomic protocols or rollbacks are required.

---

### Q11: Why are raw pointers and dynamic containers like `std::string` forbidden in shared memory?
**Answer:** Pointers and dynamic containers store virtual memory addresses pointing to the process's private heap. When another process maps the shared memory segment, those addresses are invalid or point to unmapped memory in its own address space, causing immediate segmentation faults (`SIGSEGV`). Only self-contained, fixed-layout structs with fixed arrays (`char name[32]`) are process-safe.

---

### Q12: What is the purpose of the `version_counter` in `SharedRegistry`?
**Answer:** The `version_counter` implements optimistic sequence counting. Readers take a snapshot of the version before and after copying shared data. If the counter changed during the read, the reader knows a concurrent write occurred and can retry, ensuring clean snapshots without holding heavy read locks.

---

### Q13: Explain how System V Message Queues support priority-based triage.
**Answer:** In `msgsnd()` and `msgrcv()`, messages include a `long mtype`. MedSync routes emergency alerts on `mtype = 1` (`MSG_EMERGENCY_ALERT`), while doctor assignment requests are sent to specific doctor channels (`mtype = 10 + doctor_id`). Workers can filter messages by specifying the desired `mtype` in `msgrcv()`.

---

### Q14: What is the difference between blocking and non-blocking `msgrcv()`?
**Answer:** By default, `msgrcv()` suspends the calling process until a message of the requested type is available in the queue. Passing the `IPC_NOWAIT` flag makes the call non-blocking; if no message exists, it returns immediately with error `ENOMSG`, allowing the worker to service other events or check shutdown signals.

---

### Q15: How are zombie processes prevented when child processes terminate?
**Answer:** When a child process terminates, it becomes a zombie until its parent reads its exit status. The Main Controller handles `SIGCHLD` and periodically calls `waitpid(-1, &status, WNOHANG)` to reap dead child processes asynchronously without blocking the supervisor loop.

---

### Q16: What happens to System V IPC objects if the program terminates without calling `shmctl(IPC_RMID)`?
**Answer:** System V IPC objects have **kernel persistence**, not process persistence. They remain allocated in the Linux kernel until explicitly removed via `shmctl(IPC_RMID)`, `semctl(IPC_RMID)`, `msgctl(IPC_RMID)`, the `ipcrm` shell command, or a full system reboot.

---

### Q17: What are the four Coffman conditions for Deadlock, and how does MedSync prevent them?
**Answer:**
1. **Mutual Exclusion**: Required for shared data.
2. **Hold and Wait**: Prevented by acquiring all necessary locks in a single atomic pass or releasing locks before waiting on queues.
3. **No Preemption**: Addressed via `SEM_UNDO` and bounded timeouts.
4. **Circular Wait**: Prevented by strictly ordering lock acquisition (e.g., always acquire `SEM_REGISTRY_MUTEX` before `SEM_EVENT_MUTEX`, never the reverse).

---

### Q18: What is the difference between System V IPC and POSIX IPC?
**Answer:**
- **System V**: Identified by integer keys (`key_t`), uses `shmget`, `semget`, `msgget`, uses semaphore sets, historically standard across UNIX.
- **POSIX**: Identified by filesystem names (`/dev/shm/my_shm`), uses `shm_open`, `sem_open`, `mq_open`, uses standalone semaphores, conforms to modern POSIX.1b standards.

---

### Q19: What is `EINTR`, and how does MedSync handle it during system calls?
**Answer:** `EINTR` is an error code indicating that a blocking system call (like `semop` or `msgrcv`) was interrupted by a caught signal before completing. MedSync encloses system calls in retry loops:
```cpp
while (semop(semid, &sb, 1) < 0) {
    if (errno == EINTR) continue; // retry
    return false;
}
```

---

### Q20: How does the FastAPI backend bridge real-time C++ process events to the Next.js frontend?
**Answer:** FastAPI launches `medsync_sim` as a subprocess. The C++ processes emit structured newline-delimited JSON (NDJSON) events to `stdout`. A background reader thread in Python parses these lines and dispatches them across active WebSocket connections to connected Next.js clients in real time.

---

### Q21: What is a Critical Section, and what three requirements must a solution satisfy?
**Answer:** A critical section is a code block accessing shared resources that must not be concurrently executed by multiple processes. A valid solution must satisfy:
1. **Mutual Exclusion**: Only one process executes in the critical section at a time.
2. **Progress**: Processes waiting to enter cannot be blocked by processes in their remainder section.
3. **Bounded Waiting**: A bound must exist on how many times other processes can enter before a waiting process's request is granted.

---

### Q22: What is the role of the Audit Logger process?
**Answer:** The Audit Logger operates as an independent worker process that receives `MSG_AUDIT_EVENT` messages and logs immutable records (timestamp, sender PID, event type, patient ID, result) to `medsync_audit.log`, ensuring an auditable and forensic record of emergency decisions.

---

### Q23: Why is `IPC_PRIVATE` sometimes used instead of explicit integer keys?
**Answer:** `IPC_PRIVATE` instructs `shmget` or `semget` to allocate a new, unique IPC object regardless of key collisions. It is typically used when related parent and child processes communicate after `fork()`, as the child inherits the file descriptor or IPC ID directly.

---

### Q24: How does MedSync handle graceful shutdown when a user clicks 'STOP'?
**Answer:**
1. Controller broadcasts `MSG_SHUTDOWN` to the message queue.
2. Sends `SIGTERM` to child PIDs.
3. Reaps children via `waitpid()`.
4. Detaches shared memory (`shmdt`).
5. Marks IPC objects for destruction via `IPC_RMID`.
6. Emits `SIMULATION_STOPPED` to the dashboard.

---

### Q25: What is the significance of the 20,000 / 20,000 counter result in Experiment 2?
**Answer:** It provides empirical proof of synchronization correctness. 2 workers $\times$ 10,000 increments = exactly 20,000 increments. In Unsafe Mode, hundreds or thousands are lost due to CPU register overwrites; in Protected Mode, zero increments are lost, demonstrating mathematically perfect mutual exclusion.

---

### Q26: Can this simulation scale to hundreds of doctors and patients?
**Answer:** Yes. System V shared memory segment size can be increased (up to Linux kernel `shmmax`, typically gigabytes). Message queues can be scaled via `msgmnb`. For very large-scale systems, event-driven architectures with epoll or POSIX shared memory ring buffers can scale to thousands of concurrent processes.
