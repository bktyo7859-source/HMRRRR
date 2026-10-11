#include "../include/ipc_message_queue.h"
#include <iostream>
#include <vector>

#if defined(_WIN32)
#include <windows.h>
// On Windows, use a named mutex + memory-mapped circular queue for the message queue
struct WinMsgQueueStorage {
    uint32_t head;
    uint32_t tail;
    uint32_t count;
    IpcMessageBuffer slots[128];
};
static HANDLE g_win_msg_map = NULL;
static HANDLE g_win_msg_mutex = NULL;
static WinMsgQueueStorage* g_win_msg_queue = nullptr;
#endif

MessageQueueManager::MessageQueueManager(key_t key)
    : key_(key), msgid_(-1), is_creator_(false) {}

MessageQueueManager::~MessageQueueManager() {
    if (is_creator_) {
        destroy();
    }
}

bool MessageQueueManager::create(bool clean_existing_if_found) {
#if defined(_WIN32)
    std::string map_name = "Local\\MedSync_MSG_MAP_" + std::to_string(key_);
    std::string mutex_name = "Local\\MedSync_MSG_MUTEX_" + std::to_string(key_);
    if (clean_existing_if_found) {
        if (g_win_msg_map) CloseHandle(g_win_msg_map);
        if (g_win_msg_mutex) CloseHandle(g_win_msg_mutex);
    }
    g_win_msg_mutex = CreateMutexA(NULL, FALSE, mutex_name.c_str());
    g_win_msg_map = CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, sizeof(WinMsgQueueStorage), map_name.c_str());
    if (!g_win_msg_map || !g_win_msg_mutex) return false;
    
    g_win_msg_queue = static_cast<WinMsgQueueStorage*>(MapViewOfFile(g_win_msg_map, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(WinMsgQueueStorage)));
    if (!g_win_msg_queue) return false;

    WaitForSingleObject(g_win_msg_mutex, INFINITE);
    std::memset(g_win_msg_queue, 0, sizeof(WinMsgQueueStorage));
    ReleaseMutex(g_win_msg_mutex);

    is_creator_ = true;
    msgid_ = static_cast<int>(key_);
    return true;
#else
    if (clean_existing_if_found) {
        int existing = msgget(key_, 0666);
        if (existing >= 0) {
            msgctl(existing, IPC_RMID, nullptr);
        }
    }

    msgid_ = msgget(key_, IPC_CREAT | IPC_EXCL | 0666);
    if (msgid_ < 0) {
        msgid_ = msgget(key_, IPC_CREAT | 0666);
        if (msgid_ < 0) {
            std::cerr << "[MSG QUEUE ERROR] msgget failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
            return false;
        }
    }

    is_creator_ = true;
    return true;
#endif
}

bool MessageQueueManager::open() {
#if defined(_WIN32)
    std::string map_name = "Local\\MedSync_MSG_MAP_" + std::to_string(key_);
    std::string mutex_name = "Local\\MedSync_MSG_MUTEX_" + std::to_string(key_);
    g_win_msg_mutex = OpenMutexA(MUTEX_ALL_ACCESS, FALSE, mutex_name.c_str());
    g_win_msg_map = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, map_name.c_str());
    if (!g_win_msg_map || !g_win_msg_mutex) return false;
    g_win_msg_queue = static_cast<WinMsgQueueStorage*>(MapViewOfFile(g_win_msg_map, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(WinMsgQueueStorage)));
    if (!g_win_msg_queue) return false;
    msgid_ = static_cast<int>(key_);
    return true;
#else
    msgid_ = msgget(key_, 0666);
    return (msgid_ >= 0);
#endif
}

bool MessageQueueManager::destroy() {
#if defined(_WIN32)
    if (g_win_msg_queue) {
        UnmapViewOfFile(g_win_msg_queue);
        g_win_msg_queue = nullptr;
    }
    if (g_win_msg_map) {
        CloseHandle(g_win_msg_map);
        g_win_msg_map = NULL;
    }
    if (g_win_msg_mutex) {
        CloseHandle(g_win_msg_mutex);
        g_win_msg_mutex = NULL;
    }
    msgid_ = -1;
    return true;
#else
    if (msgid_ >= 0) {
        int res = msgctl(msgid_, IPC_RMID, nullptr);
        msgid_ = -1;
        return (res == 0);
    }
    return true;
#endif
}

bool MessageQueueManager::send(const EmergencyMessagePayload& payload, long mtype) {
    if (mtype <= 0) mtype = 1;

#if defined(_WIN32)
    if (!g_win_msg_queue || !g_win_msg_mutex) return false;
    WaitForSingleObject(g_win_msg_mutex, INFINITE);
    if (g_win_msg_queue->count >= 128) {
        ReleaseMutex(g_win_msg_mutex);
        return false;
    }
    uint32_t slot = g_win_msg_queue->tail;
    g_win_msg_queue->slots[slot].mtype = mtype;
    g_win_msg_queue->slots[slot].payload = payload;
    g_win_msg_queue->tail = (g_win_msg_queue->tail + 1) % 128;
    g_win_msg_queue->count++;
    ReleaseMutex(g_win_msg_mutex);
    return true;
#else
    if (msgid_ < 0) return false;

    IpcMessageBuffer buf;
    buf.mtype = mtype;
    buf.payload = payload;

    while (msgsnd(msgid_, &buf, sizeof(EmergencyMessagePayload), 0) < 0) {
        if (errno == EINTR) continue;
        std::cerr << "[MSG QUEUE SEND ERROR] msgsnd failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
        return false;
    }
    return true;
#endif
}

bool MessageQueueManager::receive(EmergencyMessagePayload& out_payload, long mtype, bool non_blocking) {
#if defined(_WIN32)
    if (!g_win_msg_queue || !g_win_msg_mutex) return false;
    while (true) {
        WaitForSingleObject(g_win_msg_mutex, INFINITE);
        if (g_win_msg_queue->count > 0) {
            for (uint32_t i = 0; i < g_win_msg_queue->count; ++i) {
                uint32_t idx = (g_win_msg_queue->head + i) % 128;
                if (mtype == 0 || g_win_msg_queue->slots[idx].mtype == mtype) {
                    out_payload = g_win_msg_queue->slots[idx].payload;
                    // Remove slot by shifting
                    for (uint32_t j = i; j + 1 < g_win_msg_queue->count; ++j) {
                        uint32_t cur = (g_win_msg_queue->head + j) % 128;
                        uint32_t nxt = (g_win_msg_queue->head + j + 1) % 128;
                        g_win_msg_queue->slots[cur] = g_win_msg_queue->slots[nxt];
                    }
                    g_win_msg_queue->count--;
                    g_win_msg_queue->tail = (g_win_msg_queue->head + g_win_msg_queue->count) % 128;
                    ReleaseMutex(g_win_msg_mutex);
                    return true;
                }
            }
        }
        ReleaseMutex(g_win_msg_mutex);
        if (non_blocking) return false;
        Sleep(20);
    }
#else
    if (msgid_ < 0) return false;

    IpcMessageBuffer buf;
    int flags = non_blocking ? IPC_NOWAIT : 0;

    while (true) {
        ssize_t bytes = msgrcv(msgid_, &buf, sizeof(EmergencyMessagePayload), mtype, flags);
        if (bytes >= 0) {
            out_payload = buf.payload;
            return true;
        }

        if (errno == ENOMSG && non_blocking) {
            return false;
        }

        if (errno == EINTR) {
            continue;
        }

        return false;
    }
#endif
}

bool MessageQueueManager::get_stats(uint32_t& out_msg_count, uint32_t& out_max_bytes) {
#if defined(_WIN32)
    if (!g_win_msg_queue) return false;
    out_msg_count = g_win_msg_queue->count;
    out_max_bytes = 128 * sizeof(IpcMessageBuffer);
    return true;
#else
    if (msgid_ < 0) return false;
    struct msqid_ds ds;
    if (msgctl(msgid_, IPC_STAT, &ds) < 0) {
        return false;
    }
    out_msg_count = static_cast<uint32_t>(ds.msg_qnum);
    out_max_bytes = static_cast<uint32_t>(ds.msg_qbytes);
    return true;
#endif
}
