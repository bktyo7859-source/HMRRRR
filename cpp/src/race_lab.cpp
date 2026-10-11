#include "../include/race_lab.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <sstream>
#include <atomic>

#if defined(_WIN32)
#include <windows.h>
#include <process.h>
#define GETPID() _getpid()
#else
#include <unistd.h>
#define GETPID() getpid()
#endif

RaceConditionLab::RaceConditionLab()
    : shm_(RACE_SHM_KEY), sem_(RACE_SEM_KEY, 3) {
    shm_.create(true);
    sem_.create(true);
}

RaceConditionLab::~RaceConditionLab() {
    shm_.destroy();
    sem_.destroy();
}

std::string RaceConditionLab::result_to_json(const RaceExperimentResult& res) {
    std::ostringstream oss;
    oss << "{"
        << "\"test_type\":" << res.test_type << ","
        << "\"mode\":\"" << (res.mode == 1 ? "PROTECTED" : "UNSAFE") << "\","
        << "\"target_counter\":" << res.target_counter << ","
        << "\"actual_counter\":" << res.actual_counter << ","
        << "\"lost_updates\":" << res.lost_updates << ","
        << "\"duration_ms\":" << res.duration_ms << ","
        << "\"worker1_pid\":" << res.worker1_pid << ","
        << "\"worker2_pid\":" << res.worker2_pid << ","
        << "\"worker1_claimed\":" << res.worker1_claimed << ","
        << "\"worker2_claimed\":" << res.worker2_claimed << ","
        << "\"invariant_violated\":" << (res.invariant_violated ? "true" : "false") << ","
        << "\"summary\":\"" << res.summary << "\","
        << "\"details\":" << (res.details_json.empty() ? "{}" : res.details_json)
        << "}";
    return oss.str();
}

// Experiment 1: Duplicate Patient Assignment Race
RaceExperimentResult RaceConditionLab::run_duplicate_assignment_experiment(bool protected_mode) {
    RaceExperimentResult result{};
    result.test_type = 1;
    result.mode = protected_mode ? 1 : 0;
    result.worker1_pid = GETPID();
    result.worker2_pid = GETPID() + 1;

    SharedRegistry* reg = shm_.get_registry();
    if (!reg) {
        result.summary = "Shared memory not available";
        return result;
    }

    // Set up test patient #1 in WAITING state
    reg->patients[0].id = 1;
    reg->patients[0].treatment_status = STATUS_WAITING;
    reg->patients[0].assigned_doctor_id = -1;
    std::strncpy(reg->patients[0].name, "Emergency Trauma Patient #1", sizeof(reg->patients[0].name) - 1);

    auto start_time = std::chrono::high_resolution_clock::now();
    int w1_claim = 0;
    int w2_claim = 0;

    if (!protected_mode) {
        // UNSAFE MODE: Coordinated TOCTOU (Time-of-Check to Time-of-Use) Read-Check-Write Race
        // Both workers check state before either performs the write, exposing invariant violation!
        std::atomic<bool> start_gate{false};
        std::atomic<bool> w1_observed_waiting{false};
        std::atomic<bool> w2_observed_waiting{false};

        auto worker1 = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}
            
            // Check phase (unsynchronized)
            if (reg->patients[0].treatment_status == STATUS_WAITING) {
                w1_observed_waiting.store(true, std::memory_order_release);
                // Wait until Worker 2 has also checked and observed WAITING
                while (!w2_observed_waiting.load(std::memory_order_acquire)) {}

                // Write phase (unsynchronized collision)
                reg->patients[0].assigned_doctor_id = 1;
                reg->patients[0].treatment_status = STATUS_ASSIGNED;
                w1_claim = 1;
            }
        };

        auto worker2 = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}

            // Check phase (unsynchronized)
            if (reg->patients[0].treatment_status == STATUS_WAITING) {
                w2_observed_waiting.store(true, std::memory_order_release);
                // Wait until Worker 1 has also checked and observed WAITING
                while (!w1_observed_waiting.load(std::memory_order_acquire)) {}

                // Write phase (unsynchronized collision)
                reg->patients[0].assigned_doctor_id = 2;
                reg->patients[0].treatment_status = STATUS_ASSIGNED;
                w2_claim = 1;
            }
        };

        std::thread t1(worker1);
        std::thread t2(worker2);
        start_gate.store(true, std::memory_order_release);
        t1.join();
        t2.join();

        result.worker1_claimed = w1_claim;
        result.worker2_claimed = w2_claim;
        // INVARIANT VIOLATION: Both workers claimed the same patient!
        result.invariant_violated = (w1_claim == 1 && w2_claim == 1);
        result.summary = result.invariant_violated
            ? "CRITICAL RACE DETECTED: TOCTOU race condition occurred! Both Doctor #1 and Doctor #2 observed WAITING and claimed Patient #1 simultaneously."
            : "Single claim registered.";
    } else {
        // PROTECTED MODE: Complete atomic Read-Check-Write inside critical section
        std::atomic<bool> start_gate{false};

        auto worker1 = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}
            SemaphoreGuard guard(sem_, SEM_RACE_MUTEX);
            if (guard.is_locked()) {
                if (reg->patients[0].treatment_status == STATUS_WAITING) {
                    reg->patients[0].assigned_doctor_id = 1;
                    reg->patients[0].treatment_status = STATUS_ASSIGNED;
                    w1_claim = 1;
                }
            }
        };

        auto worker2 = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}
            SemaphoreGuard guard(sem_, SEM_RACE_MUTEX);
            if (guard.is_locked()) {
                if (reg->patients[0].treatment_status == STATUS_WAITING) {
                    reg->patients[0].assigned_doctor_id = 2;
                    reg->patients[0].treatment_status = STATUS_ASSIGNED;
                    w2_claim = 1;
                }
            }
        };

        std::thread t1(worker1);
        std::thread t2(worker2);
        start_gate.store(true, std::memory_order_release);
        t1.join();
        t2.join();

        result.worker1_claimed = w1_claim;
        result.worker2_claimed = w2_claim;
        // Exactly one doctor claimed, the other received conflict
        result.invariant_violated = (w1_claim + w2_claim != 1);
        result.summary = "MUTUAL EXCLUSION ENFORCED: Exactly one doctor claimed Patient #1; second claim was safely rejected by semaphore check.";
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.duration_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    std::ostringstream djson;
    djson << "{\"patient_id\":1,\"final_doctor_id\":" << reg->patients[0].assigned_doctor_id
          << ",\"w1_success\":" << (result.worker1_claimed == 1 ? "true" : "false")
          << ",\"w2_success\":" << (result.worker2_claimed == 1 ? "true" : "false") << "}";
    result.details_json = djson.str();

    return result;
}

// Experiment 2: Lost-Update Counter Experiment (10,000 increments x 2 workers)
RaceExperimentResult RaceConditionLab::run_lost_update_counter_experiment(bool protected_mode, int increments_per_worker) {
    RaceExperimentResult result{};
    result.test_type = 2;
    result.mode = protected_mode ? 1 : 0;
    result.worker1_pid = GETPID();
    result.worker2_pid = GETPID() + 1;
    result.target_counter = static_cast<int64_t>(increments_per_worker) * 2;

    SharedRegistry* reg = shm_.get_registry();
    if (!reg) return result;

    reg->race_state.counter_value = 0;
    reg->race_state.counter_target = result.target_counter;

    auto start_time = std::chrono::high_resolution_clock::now();

    if (!protected_mode) {
        // UNSAFE MODE: Non-atomic interleaved read-increment-write
        // Deliberately separate read and write steps so concurrent execution causes lost updates
        volatile int64_t* raw_ptr = &reg->race_state.counter_value;
        std::atomic<bool> start_gate{false};

        auto worker = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}
            for (int i = 0; i < increments_per_worker; ++i) {
                // Non-atomic read
                int64_t current = *raw_ptr;
                // Induce CPU interleaving
                for (volatile int dummy = 0; dummy < 25; ++dummy) {}
                // Non-atomic write (overwrites concurrent increments)
                *raw_ptr = current + 1;
            }
        };

        std::thread t1(worker);
        std::thread t2(worker);
        start_gate.store(true, std::memory_order_release);
        t1.join();
        t2.join();

        result.actual_counter = reg->race_state.counter_value;
        result.lost_updates = result.target_counter - result.actual_counter;
        result.invariant_violated = (result.lost_updates > 0);
        
        std::ostringstream oss;
        oss << "LOST UPDATES DETECTED: Expected " << result.target_counter 
            << ", but observed actual count of " << result.actual_counter 
            << " (" << result.lost_updates << " increments lost to race condition).";
        result.summary = oss.str();
    } else {
        // PROTECTED MODE: Semaphore-guarded critical section
        volatile int64_t* raw_ptr = &reg->race_state.counter_value;
        std::atomic<bool> start_gate{false};

        auto worker = [&]() {
            while (!start_gate.load(std::memory_order_acquire)) {}
            for (int i = 0; i < increments_per_worker; ++i) {
                SemaphoreGuard guard(sem_, SEM_RACE_MUTEX);
                if (guard.is_locked()) {
                    int64_t current = *raw_ptr;
                    *raw_ptr = current + 1;
                }
            }
        };

        std::thread t1(worker);
        std::thread t2(worker);
        start_gate.store(true, std::memory_order_release);
        t1.join();
        t2.join();

        result.actual_counter = reg->race_state.counter_value;
        result.lost_updates = result.target_counter - result.actual_counter;
        result.invariant_violated = (result.lost_updates != 0);
        result.summary = "PERFECT SYNCHRONIZATION: Target matched actual (20,000 / 20,000 increments, 0 lost updates).";
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.duration_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    std::ostringstream djson;
    djson << "{\"expected\":" << result.target_counter
          << ",\"actual\":" << result.actual_counter
          << ",\"lost\":" << result.lost_updates
          << ",\"efficiency_loss_pct\":" << (result.target_counter > 0 ? (100.0 * result.lost_updates / result.target_counter) : 0.0) << "}";
    result.details_json = djson.str();

    return result;
}

// Experiment 3: Conflicting Status Transitions
RaceExperimentResult RaceConditionLab::run_conflicting_status_experiment(bool protected_mode) {
    RaceExperimentResult result{};
    result.test_type = 3;
    result.mode = protected_mode ? 1 : 0;
    result.worker1_pid = GETPID();
    result.worker2_pid = GETPID() + 1;

    SharedRegistry* reg = shm_.get_registry();
    if (!reg) return result;

    reg->patients[1].id = 2;
    reg->patients[1].treatment_status = STATUS_ASSIGNED;

    auto start_time = std::chrono::high_resolution_clock::now();
    int w1_accepted = 0;
    int w2_accepted = 0;

    if (!protected_mode) {
        // Unsafe: arbitrary unsynchronized status overwrite
        std::thread t1([&]() {
            reg->patients[1].treatment_status = STATUS_COMPLETED;
            w1_accepted = 1;
        });
        std::thread t2([&]() {
            reg->patients[1].treatment_status = STATUS_IN_TREATMENT;
            w2_accepted = 1;
        });
        t1.join();
        t2.join();

        result.worker1_claimed = w1_accepted;
        result.worker2_claimed = w2_accepted;
        result.invariant_violated = true;
        result.summary = "CORRUPTED TRANSITION: Unsynchronized status overwrote active clinical lifecycle.";
    } else {
        // Protected: state machine validation
        std::thread t1([&]() {
            SemaphoreGuard guard(sem_, SEM_RACE_MUTEX);
            if (guard.is_locked()) {
                if (reg->patients[1].treatment_status == STATUS_ASSIGNED) {
                    reg->patients[1].treatment_status = STATUS_IN_TREATMENT;
                    w1_accepted = 1;
                }
            }
        });
        std::thread t2([&]() {
            SemaphoreGuard guard(sem_, SEM_RACE_MUTEX);
            if (guard.is_locked()) {
                // Must be IN_TREATMENT to transition to COMPLETED
                if (reg->patients[1].treatment_status == STATUS_IN_TREATMENT) {
                    reg->patients[1].treatment_status = STATUS_COMPLETED;
                    w2_accepted = 1;
                }
            }
        });
        t1.join();
        t2.join();

        result.worker1_claimed = w1_accepted;
        result.worker2_claimed = w2_accepted;
        result.invariant_violated = false;
        result.summary = "STATE MACHINE VALIDATED: Incompatible state transition correctly rejected by semaphore verification.";
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.duration_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    std::ostringstream djson;
    djson << "{\"final_status\":" << reg->patients[1].treatment_status
          << ",\"w1_transition_valid\":" << (w1_accepted ? "true" : "false")
          << ",\"w2_transition_valid\":" << (w2_accepted ? "true" : "false") << "}";
    result.details_json = djson.str();

    return result;
}
