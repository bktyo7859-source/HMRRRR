#include "../include/patient_monitor.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <random>

#if defined(_WIN32)
#include <windows.h>
#include <process.h>
#define GETPID() _getpid()
#else
#include <unistd.h>
#define GETPID() getpid()
#endif

PatientMonitor::PatientMonitor(int monitor_id)
    : monitor_id_(monitor_id), pid_(GETPID()), running_(false) {}

PatientMonitor::~PatientMonitor() {
    stop();
}

void PatientMonitor::stop() {
    running_ = false;
}

void PatientMonitor::simulate_vital_changes(PatientRecord& p) {
    static std::mt19937 rng(1337 + p.id);
    std::uniform_int_distribution<int> hr_delta(-3, 4);
    std::uniform_int_distribution<int> bp_delta(-2, 3);
    std::uniform_int_distribution<int> spo2_delta(-1, 1);

    // Apply stochastic physiological drift
    p.heart_rate += hr_delta(rng);
    p.blood_pressure_systolic += bp_delta(rng);
    p.blood_pressure_diastolic += bp_delta(rng);
    p.oxygen_saturation += spo2_delta(rng);

    // Physiological bounds
    if (p.heart_rate < 40) p.heart_rate = 40;
    if (p.heart_rate > 165) p.heart_rate = 165;
    if (p.blood_pressure_systolic < 70) p.blood_pressure_systolic = 70;
    if (p.blood_pressure_systolic > 210) p.blood_pressure_systolic = 210;
    if (p.blood_pressure_diastolic < 40) p.blood_pressure_diastolic = 40;
    if (p.blood_pressure_diastolic > 130) p.blood_pressure_diastolic = 130;
    if (p.oxygen_saturation < 80) p.oxygen_saturation = 80;
    if (p.oxygen_saturation > 100) p.oxygen_saturation = 100;
}

bool PatientMonitor::check_and_raise_alerts(PatientRecord& p, uint32_t& msg_id_seq) {
    bool newly_critical = false;
    char reason[64] = {0};

    // Demonstrative triage thresholds (clearly labeled as pedagogical simulation rules)
    if (p.oxygen_saturation <= 89) {
        newly_critical = true;
        std::snprintf(reason, sizeof(reason), "Severe Hypoxemia (SpO2: %d%%)", p.oxygen_saturation);
    } else if (p.heart_rate >= 135) {
        newly_critical = true;
        std::snprintf(reason, sizeof(reason), "Severe Tachycardia (HR: %d bpm)", p.heart_rate);
    } else if (p.heart_rate <= 44) {
        newly_critical = true;
        std::snprintf(reason, sizeof(reason), "Critical Bradycardia (HR: %d bpm)", p.heart_rate);
    } else if (p.blood_pressure_systolic >= 185) {
        newly_critical = true;
        std::snprintf(reason, sizeof(reason), "Hypertensive Urgency (SBP: %d mmHg)", p.blood_pressure_systolic);
    }

    if (newly_critical && p.treatment_status == STATUS_WAITING) {
        p.priority = PRIORITY_CRITICAL;
        p.alert_active = 1;
        std::snprintf(p.active_alert_message, sizeof(p.active_alert_message), "%s", reason);

        // Dispatch IPC System V Message
        EmergencyMessagePayload alert;
        alert.version = 1;
        alert.message_id = ++msg_id_seq;
        alert.msg_type = MSG_EMERGENCY_ALERT;
        alert.patient_id = p.id;
        alert.doctor_id = -1;
        alert.priority = PRIORITY_CRITICAL;
        alert.sender_pid = pid_;
        
        auto now = std::chrono::system_clock::now();
        alert.timestamp_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
        std::snprintf(alert.text, sizeof(alert.text), "%s", reason);
        alert.result_code = 0;

        msg_queue_.send(alert, MSG_EMERGENCY_ALERT);
        return true;
    }
    return false;
}

void PatientMonitor::run() {
    if (!shm_.attach() || !sem_.open() || !msg_queue_.open()) {
        std::cerr << "[PATIENT MONITOR] Failed to attach to IPC objects." << std::endl;
        return;
    }

    pid_ = GETPID();
    running_ = true;
    uint32_t msg_id_seq = 1000;

    std::cout << "{\"event\":\"WORKER_STARTED\",\"worker\":\"PATIENT_MONITOR\",\"pid\":" << pid_ << "}" << std::endl;

    while (running_) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1200));

        // Acquire mutual exclusion semaphore before inspecting and updating shared patients
        {
            SemaphoreGuard guard(sem_, SEM_REGISTRY_MUTEX);
            if (!guard.is_locked()) continue;

            SharedRegistry* reg = shm_.get_registry();
            if (!reg || reg->simulation_status != SIM_RUNNING) {
                continue;
            }

            auto now = std::chrono::system_clock::now();
            int64_t now_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

            for (uint32_t i = 0; i < reg->patient_count; ++i) {
                PatientRecord& p = reg->patients[i];
                if (p.treatment_status == STATUS_COMPLETED) continue;

                simulate_vital_changes(p);
                p.last_updated_epoch_ms = now_ms;

                bool alerted = check_and_raise_alerts(p, msg_id_seq);
                if (alerted) {
                    reg->total_alerts_generated++;
                    std::cout << "{\"event\":\"ALERT_TRIGGERED\",\"patient_id\":" << p.id 
                              << ",\"name\":\"" << p.name << "\",\"priority\":" << p.priority 
                              << ",\"hr\":" << p.heart_rate << ",\"spo2\":" << p.oxygen_saturation 
                              << ",\"reason\":\"" << p.active_alert_message << "\"}" << std::endl;
                }
            }

            // Update worker record
            reg->workers[ROLE_PATIENT_MONITOR].pid = pid_;
            reg->workers[ROLE_PATIENT_MONITOR].state = 1;
            reg->workers[ROLE_PATIENT_MONITOR].lock_acquisitions++;
            reg->workers[ROLE_PATIENT_MONITOR].last_heartbeat_epoch_ms = now_ms;
            reg->version_counter++;
        }
    }

    std::cout << "{\"event\":\"WORKER_STOPPED\",\"worker\":\"PATIENT_MONITOR\",\"pid\":" << pid_ << "}" << std::endl;
}
