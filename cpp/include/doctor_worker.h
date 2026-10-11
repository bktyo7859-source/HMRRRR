#ifndef MEDSYNC_DOCTOR_WORKER_H
#define MEDSYNC_DOCTOR_WORKER_H

#include "common.h"
#include "ipc_shared_memory.h"
#include "ipc_semaphore.h"
#include "ipc_message_queue.h"

class DoctorWorker {
private:
    int doctor_id_;
    pid_t pid_;
    SharedMemoryManager shm_;
    SemaphoreManager sem_;
    MessageQueueManager msg_queue_;
    bool running_;

    void treat_patient(int patient_id);

public:
    DoctorWorker(int doctor_id);
    ~DoctorWorker();

    void run();
    void stop();
};

#endif // MEDSYNC_DOCTOR_WORKER_H
