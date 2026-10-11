#ifndef MEDSYNC_IPC_SEMAPHORE_H
#define MEDSYNC_IPC_SEMAPHORE_H

#include "common.h"
#if !defined(_WIN32)
#include <sys/ipc.h>
#include <sys/sem.h>
#endif
#include <cerrno>
#include <cstring>
#include <string>

#if !defined(_WIN32)
#if defined(__GNU_LIBRARY__) && !defined(_SEM_SEMUN_UNDEFINED)
    // already defined in sys/sem.h
#elif !defined(_SEMUN_DEFINED)
    #define _SEMUN_DEFINED
    union semun {
        int val;
        struct semid_ds *buf;
        unsigned short *array;
        struct seminfo *__buf;
    };
#endif
#endif

class SemaphoreManager {
private:
    key_t key_;
    int semid_;
    int sem_count_;
    bool is_creator_;

public:
    SemaphoreManager(key_t key = SEM_KEY_DEFAULT, int sem_count = SEM_COUNT);
    ~SemaphoreManager();

    // Create semaphore set and initialize values
    bool create(bool clean_existing_if_found = true);

    // Open existing semaphore set
    bool open();

    // Destroy semaphore set
    bool destroy();

    // Acquire lock (P operation / wait)
    // with_undo: uses SEM_UNDO to release on process crash
    bool lock(int sem_index = SEM_REGISTRY_MUTEX, bool with_undo = true);

    // Release lock (V operation / signal)
    bool unlock(int sem_index = SEM_REGISTRY_MUTEX, bool with_undo = true);

    // Try lock (non-blocking)
    bool try_lock(int sem_index = SEM_REGISTRY_MUTEX, bool with_undo = true);

    // Get current value
    int get_val(int sem_index) const;

    // Accessors
    int get_semid() const { return semid_; }
    key_t get_key() const { return key_; }
    bool is_valid() const { return semid_ != -1; }
};

// RAII Lock Guard for System V Semaphores
class SemaphoreGuard {
private:
    SemaphoreManager& sem_;
    int index_;
    bool locked_;
    bool with_undo_;

public:
    SemaphoreGuard(SemaphoreManager& sem, int index = SEM_REGISTRY_MUTEX, bool with_undo = true)
        : sem_(sem), index_(index), locked_(false), with_undo_(with_undo) {
        if (sem_.lock(index_, with_undo_)) {
            locked_ = true;
        }
    }

    ~SemaphoreGuard() {
        if (locked_) {
            sem_.unlock(index_, with_undo_);
        }
    }

    bool is_locked() const { return locked_; }

    void unlock_early() {
        if (locked_) {
            sem_.unlock(index_, with_undo_);
            locked_ = false;
        }
    }
};

#endif // MEDSYNC_IPC_SEMAPHORE_H
