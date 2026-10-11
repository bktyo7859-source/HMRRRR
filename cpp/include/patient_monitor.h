#ifndef MEDSYNC_PATIENT_MONITOR_H
#define MEDSYNC_PATIENT_MONITOR_H

#include "common.h"
#include "ipc_shared_memory.h"
#include "ipc_semaphore.h"
#include "ipc_message_queue.h"

class PatientMonitor {
private:
    int monitor_id_;
    pid_t pid_;
    SharedMemoryManager shm_;
    SemaphoreManager sem_;
    MessageQueueManager msg_queue_;
    bool running_;

    void simulate_vital_changes(PatientRecord& p);
    bool check_and_raise_alerts(PatientRecord& p, uint32_t& msg_id_seq);

public:
    PatientMonitor(int monitor_id = 1);
    ~PatientMonitor();

    void run();
    void stop();
};

#endif // MEDSYNC_PATIENT_MONITOR_H
