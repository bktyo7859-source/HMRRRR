#include "../include/ipc_semaphore.h"
#include <iostream>

#if defined(_WIN32)
#include <windows.h>
static HANDLE g_win_semaphores[SEM_COUNT] = {NULL, NULL, NULL};
#endif

SemaphoreManager::SemaphoreManager(key_t key, int sem_count)
    : key_(key), semid_(-1), sem_count_(sem_count), is_creator_(false) {}

SemaphoreManager::~SemaphoreManager() {
    if (is_creator_) {
        destroy();
    }
}

bool SemaphoreManager::create(bool clean_existing_if_found) {
#if defined(_WIN32)
    for (int i = 0; i < sem_count_; ++i) {
        std::string name = "Local\\MedSync_SEM_" + std::to_string(key_) + "_" + std::to_string(i);
        if (clean_existing_if_found && g_win_semaphores[i]) {
            CloseHandle(g_win_semaphores[i]);
            g_win_semaphores[i] = NULL;
        }
        g_win_semaphores[i] = CreateSemaphoreA(NULL, 1, 1, name.c_str());
        if (!g_win_semaphores[i]) {
            std::cerr << "[SEM ERROR] CreateSemaphore failed: " << GetLastError() << std::endl;
            return false;
        }
    }
    is_creator_ = true;
    semid_ = static_cast<int>(key_);
    return true;
#else
    if (clean_existing_if_found) {
        int existing = semget(key_, sem_count_, 0666);
        if (existing >= 0) {
            semctl(existing, 0, IPC_RMID);
        }
    }

    semid_ = semget(key_, sem_count_, IPC_CREAT | IPC_EXCL | 0666);
    if (semid_ < 0) {
        semid_ = semget(key_, sem_count_, IPC_CREAT | 0666);
        if (semid_ < 0) {
            std::cerr << "[SEM ERROR] semget failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
            return false;
        }
    }

    // Initialize each semaphore in the set to 1 (unlocked mutex state)
    union semun arg;
    arg.val = 1;
    for (int i = 0; i < sem_count_; ++i) {
        if (semctl(semid_, i, SETVAL, arg) < 0) {
            std::cerr << "[SEM ERROR] semctl SETVAL failed: " << strerror(errno) << std::endl;
            return false;
        }
    }

    is_creator_ = true;
    return true;
#endif
}

bool SemaphoreManager::open() {
#if defined(_WIN32)
    for (int i = 0; i < sem_count_; ++i) {
        std::string name = "Local\\MedSync_SEM_" + std::to_string(key_) + "_" + std::to_string(i);
        g_win_semaphores[i] = OpenSemaphoreA(SEMAPHORE_ALL_ACCESS, FALSE, name.c_str());
        if (!g_win_semaphores[i]) {
            return false;
        }
    }
    semid_ = static_cast<int>(key_);
    return true;
#else
    semid_ = semget(key_, sem_count_, 0666);
    return (semid_ >= 0);
#endif
}

bool SemaphoreManager::destroy() {
#if defined(_WIN32)
    for (int i = 0; i < sem_count_; ++i) {
        if (g_win_semaphores[i]) {
            CloseHandle(g_win_semaphores[i]);
            g_win_semaphores[i] = NULL;
        }
    }
    semid_ = -1;
    return true;
#else
    if (semid_ >= 0) {
        int res = semctl(semid_, 0, IPC_RMID);
        semid_ = -1;
        return (res == 0);
    }
    return true;
#endif
}

bool SemaphoreManager::lock(int sem_index, bool with_undo) {
    if (sem_index < 0 || sem_index >= sem_count_) return false;

#if defined(_WIN32)
    (void)with_undo;
    if (!g_win_semaphores[sem_index]) return false;
    DWORD res = WaitForSingleObject(g_win_semaphores[sem_index], INFINITE);
    return (res == WAIT_OBJECT_0);
#else
    if (semid_ < 0) return false;

    struct sembuf sb;
    sb.sem_num = static_cast<unsigned short>(sem_index);
    sb.sem_op = -1; // P operation: decrement by 1 (blocks if 0)
    sb.sem_flg = with_undo ? SEM_UNDO : 0;

    while (semop(semid_, &sb, 1) < 0) {
        if (errno == EINTR) {
            // Signal interrupted system call; retry
            continue;
        }
        std::cerr << "[SEM LOCK ERROR] semop failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
        return false;
    }
    return true;
#endif
}

bool SemaphoreManager::unlock(int sem_index, bool with_undo) {
    if (sem_index < 0 || sem_index >= sem_count_) return false;

#if defined(_WIN32)
    (void)with_undo;
    if (!g_win_semaphores[sem_index]) return false;
    return ReleaseSemaphore(g_win_semaphores[sem_index], 1, NULL) != FALSE;
#else
    if (semid_ < 0) return false;

    struct sembuf sb;
    sb.sem_num = static_cast<unsigned short>(sem_index);
    sb.sem_op = 1; // V operation: increment by 1
    sb.sem_flg = with_undo ? SEM_UNDO : 0;

    while (semop(semid_, &sb, 1) < 0) {
        if (errno == EINTR) {
            continue;
        }
        std::cerr << "[SEM UNLOCK ERROR] semop failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
        return false;
    }
    return true;
#endif
}

bool SemaphoreManager::try_lock(int sem_index, bool with_undo) {
    if (sem_index < 0 || sem_index >= sem_count_) return false;

#if defined(_WIN32)
    (void)with_undo;
    if (!g_win_semaphores[sem_index]) return false;
    DWORD res = WaitForSingleObject(g_win_semaphores[sem_index], 0);
    return (res == WAIT_OBJECT_0);
#else
    if (semid_ < 0) return false;

    struct sembuf sb;
    sb.sem_num = static_cast<unsigned short>(sem_index);
    sb.sem_op = -1;
    sb.sem_flg = IPC_NOWAIT | (with_undo ? SEM_UNDO : 0);

    return (semop(semid_, &sb, 1) == 0);
#endif
}

int SemaphoreManager::get_val(int sem_index) const {
    if (sem_index < 0 || sem_index >= sem_count_) return -1;
#if defined(_WIN32)
    return 1;
#else
    if (semid_ < 0) return -1;
    return semctl(semid_, sem_index, GETVAL);
#endif
}
