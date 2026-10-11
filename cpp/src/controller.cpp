#include "../include/controller.h"
#include "../include/patient_monitor.h"
#include "../include/dispatcher.h"
#include "../include/doctor_worker.h"
#include "../include/audit_logger.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <csignal>

#if defined(_WIN32)
#include <windows.h>
#include <process.h>
#define GETPID() _getpid()
#else
#include <unistd.h>
#include <sys/wait.h>
#define GETPID() getpid()
#endif

static Controller* g_controller_instance = nullptr;

static void signal_handler(int sig) {
    std::cout << "{\"event\":\"SIGNAL_RECEIVED\",\"signal\":" << sig << "}" << std::endl;
    if (g_controller_instance) {
        g_controller_instance->shutdown_system();
    }
}

Controller::Controller(const std::string& audit_log_path)
    : shm_(SHM_KEY_DEFAULT), sem_(SEM_KEY_DEFAULT, SEM_COUNT), msg_queue_(MSG_KEY_DEFAULT),
      running_(false), audit_log_path_(audit_log_path) {
    g_controller_instance = this;
}

Controller::~Controller() {
    shutdown_system();
    g_controller_instance = nullptr;
}

void Controller::emit_json_event(const std::string& event_type, const std::string& payload_json) {
    std::cout << "{\"event\":\"" << event_type << "\"," << payload_json << "}" << std::endl;
    std::cout.flush();
}

bool Controller::initialize_system() {
    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);

    // 1. Create System V Shared Memory
    if (!shm_.create(true)) {
        std::cerr << "[CONTROLLER] Failed to create shared memory segment." << std::endl;
        return false;
    }

    // 2. Create System V Semaphores
    if (!sem_.create(true)) {
        std::cerr << "[CONTROLLER] Failed to create semaphores." << std::endl;
        return false;
    }

    // 3. Create System V Message Queue
    if (!msg_queue_.create(true)) {
        std::cerr << "[CONTROLLER] Failed to create message queue." << std::endl;
        return false;
    }

    // Initialize controller worker record
    SharedRegistry* reg = shm_.get_registry();
    if (reg) {
        reg->workers[ROLE_CONTROLLER].role = ROLE_CONTROLLER;
        reg->workers[ROLE_CONTROLLER].pid = GETPID();
        reg->workers[ROLE_CONTROLLER].state = 1;
        reg->workers[ROLE_CONTROLLER].last_heartbeat_epoch_ms = reg->start_time_epoch_ms;
    }

    emit_json_event("IPC_INITIALIZED", "\"shm_key\":" + std::to_string(SHM_KEY_DEFAULT) +
                                        ",\"sem_key\":" + std::to_string(SEM_KEY_DEFAULT) +
                                        ",\"msg_key\":" + std::to_string(MSG_KEY_DEFAULT));
    return true;
}

void Controller::run_patient_monitor_process(int monitor_id) {
    PatientMonitor monitor(monitor_id);
    monitor.run();
}

void Controller::run_dispatcher_process() {
    EmergencyDispatcher dispatcher;
    dispatcher.run();
}

void Controller::run_doctor_worker_process(int doctor_id) {
    DoctorWorker doctor(doctor_id);
    doctor.run();
}

void Controller::run_audit_logger_process(const std::string& log_file) {
    AuditLogger logger(log_file);
    logger.run();
}

bool Controller::start_simulation() {
    SharedRegistry* reg = shm_.get_registry();
    if (!reg) return false;

    reg->simulation_status = SIM_RUNNING;
    running_ = true;

#if defined(_WIN32)
    // On Windows, run independent worker threads simulating OS multi-processes
    // Each records its thread / simulated PID
    std::thread t_monitor([]() { Controller::run_patient_monitor_process(1); });
    t_monitor.detach();

    std::thread t_disp([]() { Controller::run_dispatcher_process(); });
    t_disp.detach();

    for (int doc_id = 1; doc_id <= 3; ++doc_id) {
        std::thread t_doc([doc_id]() { Controller::run_doctor_worker_process(doc_id); });
        t_doc.detach();
    }

    std::string log_p = audit_log_path_;
    std::thread t_log([log_p]() { Controller::run_audit_logger_process(log_p); });
    t_log.detach();

#else
    // On Linux / POSIX: use genuine fork() to spawn actual independent OS worker processes!
    // 1. Fork Patient Monitor
    pid_t pid_monitor = fork();
    if (pid_monitor == 0) {
        run_patient_monitor_process(1);
        exit(0);
    }
    child_pids_.push_back(pid_monitor);

    // 2. Fork Emergency Dispatcher
    pid_t pid_disp = fork();
    if (pid_disp == 0) {
        run_dispatcher_process();
        exit(0);
    }
    child_pids_.push_back(pid_disp);

    // 3. Fork Doctor Workers (1 to 3)
    for (int doc_id = 1; doc_id <= 3; ++doc_id) {
        pid_t pid_doc = fork();
        if (pid_doc == 0) {
            run_doctor_worker_process(doc_id);
            exit(0);
        }
        child_pids_.push_back(pid_doc);
    }

    // 4. Fork Audit Logger
    pid_t pid_log = fork();
    if (pid_log == 0) {
        run_audit_logger_process(audit_log_path_);
        exit(0);
    }
    child_pids_.push_back(pid_log);
#endif

    emit_json_event("SIMULATION_STARTED", "\"status\":\"RUNNING\"");
    return true;
}

void Controller::run_supervisor_loop() {
    uint32_t ticks = 0;

    while (running_) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        ticks++;

        SharedRegistry* reg = shm_.get_registry();
        if (reg) {
            reg->uptime_seconds = ticks;
            
            // Count active critical alerts and available doctors
            uint32_t critical_count = 0;
            for (uint32_t i = 0; i < reg->patient_count; ++i) {
                if (reg->patients[i].priority == PRIORITY_CRITICAL && reg->patients[i].treatment_status != STATUS_COMPLETED) {
                    critical_count++;
                }
            }
            reg->critical_patients_count = critical_count;

            uint32_t avail_docs = 0;
            for (uint32_t i = 0; i < reg->doctor_count; ++i) {
                if (reg->doctors[i].status == DOC_AVAILABLE) {
                    avail_docs++;
                }
            }
            reg->available_doctors_count = avail_docs;

            // Emit periodic snapshot JSON for backend WebSockets
            std::cout << "{\"event\":\"HEARTBEAT\",\"uptime\":" << ticks 
                      << ",\"critical_count\":" << critical_count 
                      << ",\"available_docs\":" << avail_docs 
                      << ",\"version\":" << reg->version_counter 
                      << ",\"total_messages\":" << reg->total_messages_processed 
                      << ",\"total_assignments\":" << reg->total_assignments_made << "}" << std::endl;
        }

#if !defined(_WIN32)
        // Check for terminated children on Linux
        int status;
        pid_t dead_pid = waitpid(-1, &status, WNOHANG);
        if (dead_pid > 0) {
            emit_json_event("WORKER_EXIT", "\"pid\":" + std::to_string(dead_pid) + ",\"status\":" + std::to_string(status));
        }
#endif
    }
}

void Controller::pause_simulation() {
    SharedRegistry* reg = shm_.get_registry();
    if (reg) {
        reg->simulation_status = SIM_PAUSED;
        emit_json_event("SIMULATION_PAUSED", "\"status\":\"PAUSED\"");
    }
}

void Controller::resume_simulation() {
    SharedRegistry* reg = shm_.get_registry();
    if (reg) {
        reg->simulation_status = SIM_RUNNING;
        emit_json_event("SIMULATION_RESUMED", "\"status\":\"RUNNING\"");
    }
}

bool Controller::trigger_test_emergency(int patient_id, int priority, const std::string& reason) {
    SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
    if (!guard.is_locked()) return false;

    SharedRegistry* reg = shm_.get_registry();
    if (!reg) return false;

    for (uint32_t i = 0; i < reg->patient_count; ++i) {
        if (reg->patients[i].id == patient_id) {
            PatientRecord& p = reg->patients[i];
            p.priority = priority;
            p.alert_active = 1;
            p.treatment_status = STATUS_WAITING;
            p.assigned_doctor_id = -1;
            p.assigned_doctor_name[0] = '\0';
            std::strncpy(p.active_alert_message, reason.c_str(), sizeof(p.active_alert_message) - 1);
            
            if (priority == PRIORITY_CRITICAL) {
                p.heart_rate = 142;
                p.oxygen_saturation = 87;
                p.blood_pressure_systolic = 190;
            }

            reg->total_alerts_generated++;
            reg->version_counter++;

            // Send to System V message queue
            EmergencyMessagePayload alert{};
            alert.version = 1;
            alert.msg_type = MSG_EMERGENCY_ALERT;
            alert.patient_id = patient_id;
            alert.priority = priority;
            alert.sender_pid = GETPID();
            std::strncpy(alert.text, reason.c_str(), sizeof(alert.text) - 1);
            msg_queue_.send(alert, MSG_EMERGENCY_ALERT);

            emit_json_event("MANUAL_EMERGENCY_TRIGGERED", "\"patient_id\":" + std::to_string(patient_id) +
                                                          ",\"priority\":" + std::to_string(priority) +
                                                          ",\"reason\":\"" + reason + "\"");
            return true;
        }
    }
    return false;
}

void Controller::shutdown_system() {
    if (!running_) return;
    running_ = false;

    SharedRegistry* reg = shm_.get_registry();
    if (reg) {
        reg->simulation_status = SIM_STOPPED;
    }

#if !defined(_WIN32)
    // Kill child processes gracefully on Linux
    for (pid_t pid : child_pids_) {
        kill(pid, SIGTERM);
    }
    // Reap all children
    int status;
    while (waitpid(-1, &status, WNOHANG) > 0) {}
    child_pids_.clear();
#endif

    shm_.destroy();
    sem_.destroy();
    msg_queue_.destroy();

    emit_json_event("SIMULATION_STOPPED", "\"status\":\"STOPPED\"");
}
