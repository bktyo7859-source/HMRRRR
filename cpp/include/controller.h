#ifndef MEDSYNC_CONTROLLER_H
#define MEDSYNC_CONTROLLER_H

#include "common.h"
#include "ipc_shared_memory.h"
#include "ipc_semaphore.h"
#include "ipc_message_queue.h"
#include <vector>
#include <string>

class Controller {
private:
    SharedMemoryManager shm_;
    SemaphoreManager sem_;
    MessageQueueManager msg_queue_;
    std::vector<pid_t> child_pids_;
    bool running_;
    std::string audit_log_path_;

public:
    Controller(const std::string& audit_log_path = "medsync_audit.log");
    ~Controller();

    // Initialize all IPC resources and shared registry
    bool initialize_system();

    // Start all worker processes via fork()
    bool start_simulation();

    // Main supervisor loop: monitors children, emits periodic snapshots and handles control signals
    void run_supervisor_loop();

    // Gracefully stop all workers, reap child processes, and clean up IPC resources
    void shutdown_system();

    // Pause / Resume simulation
    void pause_simulation();
    void resume_simulation();

    // Trigger test emergency for a specific patient
    bool trigger_test_emergency(int patient_id, int priority, const std::string& reason);

    // Emit structured JSON event to stdout (for FastAPI event bridge)
    static void emit_json_event(const std::string& event_type, const std::string& payload_json);

    // Worker process entry points (called after fork in child)
    static void run_patient_monitor_process(int monitor_id);
    static void run_dispatcher_process();
    static void run_doctor_worker_process(int doctor_id);
    static void run_audit_logger_process(const std::string& log_file);
};

#endif // MEDSYNC_CONTROLLER_H
