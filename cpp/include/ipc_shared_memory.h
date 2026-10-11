#ifndef MEDSYNC_IPC_SHARED_MEMORY_H
#define MEDSYNC_IPC_SHARED_MEMORY_H

#include "common.h"
#if !defined(_WIN32)
#include <sys/ipc.h>
#include <sys/shm.h>
#endif
#include <string>

class SharedMemoryManager {
private:
    key_t key_;
    int shmid_;
    SharedRegistry* registry_;
    bool is_creator_;

public:
    SharedMemoryManager(key_t key = SHM_KEY_DEFAULT);
    ~SharedMemoryManager();

    // Create shared memory segment (fails if exists when create_new=true)
    bool create(bool clean_existing_if_found = true);

    // Attach to existing shared memory segment
    bool attach();

    // Detach from shared memory
    bool detach();

    // Mark shared memory for destruction
    bool destroy();

    // Accessors
    SharedRegistry* get_registry() { return registry_; }
    const SharedRegistry* get_registry() const { return registry_; }
    int get_shmid() const { return shmid_; }
    key_t get_key() const { return key_; }
    bool is_attached() const { return registry_ != nullptr; }

    // Initialize the default patient and doctor data
    void initialize_registry();

    // Safe snapshot reading with version checking
    bool read_snapshot(SharedRegistry& out_snapshot);
};

#endif // MEDSYNC_IPC_SHARED_MEMORY_H
