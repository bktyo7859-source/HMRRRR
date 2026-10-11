#ifndef MEDSYNC_RACE_LAB_H
#define MEDSYNC_RACE_LAB_H

#include "common.h"
#include "ipc_shared_memory.h"
#include "ipc_semaphore.h"
#include <string>

struct RaceExperimentResult {
    int test_type;                 // 1: DUPLICATE_ASSIGNMENT, 2: LOST_UPDATE_COUNTER, 3: CONFLICTING_STATUS
    int mode;                      // 0: UNSAFE, 1: PROTECTED
    int64_t target_counter;
    int64_t actual_counter;
    int64_t lost_updates;
    double duration_ms;
    int worker1_pid;
    int worker2_pid;
    int worker1_claimed;
    int worker2_claimed;
    bool invariant_violated;
    std::string summary;
    std::string details_json;
};

class RaceConditionLab {
private:
    SharedMemoryManager shm_;
    SemaphoreManager sem_;

public:
    RaceConditionLab();
    ~RaceConditionLab();

    // Experiment 1: Duplicate Patient Claim
    RaceExperimentResult run_duplicate_assignment_experiment(bool protected_mode);

    // Experiment 2: Lost-Update Counter (10,000 increments x 2 workers)
    RaceExperimentResult run_lost_update_counter_experiment(bool protected_mode, int increments_per_worker = 10000);

    // Experiment 3: Conflicting Status Transitions
    RaceExperimentResult run_conflicting_status_experiment(bool protected_mode);

    // Helper to format experiment result as JSON for streaming to dashboard
    static std::string result_to_json(const RaceExperimentResult& result);
};

#endif // MEDSYNC_RACE_LAB_H
