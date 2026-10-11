#ifndef MEDSYNC_DISPATCHER_H
#define MEDSYNC_DISPATCHER_H

#include "common.h"
#include "ipc_shared_memory.h"
#include "ipc_semaphore.h"
#include "ipc_message_queue.h"

class EmergencyDispatcher {
private:
    pid_t pid_;
    SharedMemoryManager shm_;
    SemaphoreManager sem_;
    MessageQueueManager msg_queue_;
    bool running_;

    // Attempt assignment under semaphore protection
    bool assign_doctor_to_patient(int patient_id, int priority, int& out_assigned_doc_id);

public:
    EmergencyDispatcher();
    ~EmergencyDispatcher();

    void run();
    void stop();
};

#endif // MEDSYNC_DISPATCHER_H
