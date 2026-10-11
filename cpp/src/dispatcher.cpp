#include "../include/dispatcher.h"
#include <iostream>
#include <thread>
#include <chrono>

#if defined(_WIN32)
#include <windows.h>
#include <process.h>
#define GETPID() _getpid()
#else
#include <unistd.h>
#define GETPID() getpid()
#endif

EmergencyDispatcher::EmergencyDispatcher()
    : pid_(GETPID()), running_(false) {}

EmergencyDispatcher::~EmergencyDispatcher() {
    stop();
}

void EmergencyDispatcher::stop() {
    running_ = false;
}

bool EmergencyDispatcher::assign_doctor_to_patient(int patient_id, int priority, int& out_assigned_doc_id) {
    (void)priority;
    SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
    if (!guard.is_locked()) return false;

    SharedRegistry* reg = shm_.get_registry();
    if (!reg) return false;

    // Locate patient
    PatientRecord* p = nullptr;
    for (uint32_t i = 0; i < reg->patient_count; ++i) {
        if (reg->patients[i].id == patient_id) {
            p = &reg->patients[i];
            break;
        }
    }
    if (!p) return false;

    // Invariant: patient must still be in STATUS_WAITING and unassigned
    if (p->treatment_status != STATUS_WAITING || p->assigned_doctor_id != -1) {
        return false;
    }

    // Find first available doctor
    DoctorRecord* doc = nullptr;
    for (uint32_t i = 0; i < reg->doctor_count; ++i) {
        if (reg->doctors[i].status == DOC_AVAILABLE) {
            doc = &reg->doctors[i];
            break;
        }
    }

    if (!doc) {
        // No doctor available currently
        return false;
    }

    // Atomic assignment under mutual exclusion
    doc->status = DOC_BUSY;
    doc->current_patient_id = p->id;
    out_assigned_doc_id = doc->id;

    p->treatment_status = STATUS_ASSIGNED;
    p->assigned_doctor_id = doc->id;
    std::strncpy(p->assigned_doctor_name, doc->name, sizeof(p->assigned_doctor_name) - 1);
    
    auto now = std::chrono::system_clock::now();
    p->last_updated_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    reg->total_assignments_made++;
    reg->version_counter++;
    return true;
}

void EmergencyDispatcher::run() {
    if (!shm_.attach() || !sem_.open() || !msg_queue_.open()) {
        std::cerr << "[DISPATCHER] Failed to connect to IPC resources." << std::endl;
        return;
    }

    pid_ = GETPID();
    running_ = true;

    std::cout << "{\"event\":\"WORKER_STARTED\",\"worker\":\"DISPATCHER\",\"pid\":" << pid_ << "}" << std::endl;

    while (running_) {
        EmergencyMessagePayload alert_msg;
        // Non-blocking poll on message queue
        if (msg_queue_.receive(alert_msg, MSG_EMERGENCY_ALERT, true)) {
            int assigned_doc_id = -1;
            bool success = assign_doctor_to_patient(alert_msg.patient_id, alert_msg.priority, assigned_doc_id);

            if (success) {
                // Dispatch assignment message directed to the selected doctor
                EmergencyMessagePayload assign_msg;
                assign_msg.version = 1;
                assign_msg.message_id = alert_msg.message_id + 5000;
                assign_msg.msg_type = MSG_ASSIGNMENT_REQUEST;
                assign_msg.patient_id = alert_msg.patient_id;
                assign_msg.doctor_id = assigned_doc_id;
                assign_msg.priority = alert_msg.priority;
                assign_msg.sender_pid = pid_;
                
                auto now = std::chrono::system_clock::now();
                assign_msg.timestamp_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
                std::snprintf(assign_msg.text, sizeof(assign_msg.text), "Assigned to Doctor #%d", assigned_doc_id);
                assign_msg.result_code = 0;

                // Send to doctor channel (10 + doctor_id)
                msg_queue_.send(assign_msg, 10 + assigned_doc_id);

                std::cout << "{\"event\":\"DOCTOR_ASSIGNED\",\"patient_id\":" << alert_msg.patient_id 
                          << ",\"doctor_id\":" << assigned_doc_id << ",\"priority\":" << alert_msg.priority << "}" << std::endl;

                // Update worker metrics
                SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
                if (guard.is_locked()) {
                    SharedRegistry* reg = shm_.get_registry();
                    if (reg) {
                        reg->workers[ROLE_DISPATCHER].assignments_successful++;
                        reg->workers[ROLE_DISPATCHER].messages_received++;
                        reg->total_messages_processed++;
                    }
                }
            } else {
                // Re-queue or wait if no doctors were available
                std::this_thread::sleep_for(std::chrono::milliseconds(200));
            }
        } else {
            // Also inspect unassigned waiting patients directly in case an emergency was triggered manually
            {
                SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
                if (guard.is_locked()) {
                    SharedRegistry* reg = shm_.get_registry();
                    if (reg && reg->simulation_status == SIM_RUNNING) {
                        for (uint32_t i = 0; i < reg->patient_count; ++i) {
                            if (reg->patients[i].treatment_status == STATUS_WAITING && reg->patients[i].priority <= PRIORITY_HIGH) {
                                int assigned_doc_id = -1;
                                guard.unlock_early(); // Release before helper acquires it
                                if (assign_doctor_to_patient(reg->patients[i].id, reg->patients[i].priority, assigned_doc_id)) {
                                    // Send to doctor channel
                                    EmergencyMessagePayload assign_msg{};
                                    assign_msg.version = 1;
                                    assign_msg.msg_type = MSG_ASSIGNMENT_REQUEST;
                                    assign_msg.patient_id = reg->patients[i].id;
                                    assign_msg.doctor_id = assigned_doc_id;
                                    assign_msg.sender_pid = pid_;
                                    msg_queue_.send(assign_msg, 10 + assigned_doc_id);
                                }
                                break;
                            }
                        }
                    }
                }
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(300));
        }
    }

    std::cout << "{\"event\":\"WORKER_STOPPED\",\"worker\":\"DISPATCHER\",\"pid\":" << pid_ << "}" << std::endl;
}
