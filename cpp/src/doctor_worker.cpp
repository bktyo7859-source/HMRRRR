#include "../include/doctor_worker.h"
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

DoctorWorker::DoctorWorker(int doctor_id)
    : doctor_id_(doctor_id), pid_(GETPID()), running_(false) {}

DoctorWorker::~DoctorWorker() {
    stop();
}

void DoctorWorker::stop() {
    running_ = false;
}

void DoctorWorker::treat_patient(int patient_id) {
    // 1. Transition to STATUS_IN_TREATMENT
    {
        SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
        if (!guard.is_locked()) return;

        SharedRegistry* reg = shm_.get_registry();
        if (!reg) return;

        PatientRecord* p = nullptr;
        for (uint32_t i = 0; i < reg->patient_count; ++i) {
            if (reg->patients[i].id == patient_id) {
                p = &reg->patients[i];
                break;
            }
        }

        if (p && p->assigned_doctor_id == doctor_id_) {
            p->treatment_status = STATUS_IN_TREATMENT;
            auto now = std::chrono::system_clock::now();
            p->last_updated_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
            reg->version_counter++;

            std::cout << "{\"event\":\"TREATMENT_STARTED\",\"patient_id\":" << patient_id 
                      << ",\"doctor_id\":" << doctor_id_ << ",\"doctor_name\":\"" << p->assigned_doctor_name << "\"}" << std::endl;
        }
    }

    // 2. Simulate active clinical emergency treatment procedure (duration ~3 seconds)
    std::this_thread::sleep_for(std::chrono::milliseconds(3200));

    // 3. Treatment Complete: stabilize vitals and release doctor
    {
        SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
        if (!guard.is_locked()) return;

        SharedRegistry* reg = shm_.get_registry();
        if (!reg) return;

        PatientRecord* p = nullptr;
        for (uint32_t i = 0; i < reg->patient_count; ++i) {
            if (reg->patients[i].id == patient_id) {
                p = &reg->patients[i];
                break;
            }
        }

        DoctorRecord* doc = nullptr;
        for (uint32_t i = 0; i < reg->doctor_count; ++i) {
            if (reg->doctors[i].id == doctor_id_) {
                doc = &reg->doctors[i];
                break;
            }
        }

        if (p && p->assigned_doctor_id == doctor_id_) {
            p->treatment_status = STATUS_COMPLETED;
            p->priority = PRIORITY_LOW;
            p->alert_active = 0;
            p->heart_rate = 74;
            p->blood_pressure_systolic = 120;
            p->blood_pressure_diastolic = 80;
            p->oxygen_saturation = 99;
            p->active_alert_message[0] = '\0';

            auto now = std::chrono::system_clock::now();
            p->last_updated_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

            if (doc) {
                doc->status = DOC_AVAILABLE;
                doc->current_patient_id = -1;
                doc->patients_treated_count++;
            }

            reg->version_counter++;

            std::cout << "{\"event\":\"TREATMENT_COMPLETED\",\"patient_id\":" << patient_id 
                      << ",\"doctor_id\":" << doctor_id_ << "}" << std::endl;
        }
    }
}

void DoctorWorker::run() {
    if (!shm_.attach() || !sem_.open() || !msg_queue_.open()) {
        std::cerr << "[DOCTOR " << doctor_id_ << "] Failed to connect to IPC resources." << std::endl;
        return;
    }

    pid_ = GETPID();
    running_ = true;

    // Register worker PID in doctor registry
    {
        SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
        if (guard.is_locked()) {
            SharedRegistry* reg = shm_.get_registry();
            if (reg) {
                for (uint32_t i = 0; i < reg->doctor_count; ++i) {
                    if (reg->doctors[i].id == doctor_id_) {
                        reg->doctors[i].worker_pid = pid_;
                        break;
                    }
                }
            }
        }
    }

    std::cout << "{\"event\":\"WORKER_STARTED\",\"worker\":\"DOCTOR_" << doctor_id_ << "\",\"pid\":" << pid_ << "}" << std::endl;

    while (running_) {
        EmergencyMessagePayload assign_msg;
        // Listen on channel 10 + doctor_id
        if (msg_queue_.receive(assign_msg, 10 + doctor_id_, true)) {
            if (assign_msg.msg_type == MSG_ASSIGNMENT_REQUEST) {
                treat_patient(assign_msg.patient_id);
            }
        } else {
            std::this_thread::sleep_for(std::chrono::milliseconds(250));
        }
    }

    std::cout << "{\"event\":\"WORKER_STOPPED\",\"worker\":\"DOCTOR_" << doctor_id_ << "\",\"pid\":" << pid_ << "}" << std::endl;
}
