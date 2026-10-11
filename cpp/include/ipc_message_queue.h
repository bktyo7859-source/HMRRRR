#ifndef MEDSYNC_IPC_MESSAGE_QUEUE_H
#define MEDSYNC_IPC_MESSAGE_QUEUE_H

#include "common.h"
#if !defined(_WIN32)
#include <sys/ipc.h>
#include <sys/msg.h>
#endif
#include <cerrno>
#include <cstring>
#include <string>

class MessageQueueManager {
private:
    key_t key_;
    int msgid_;
    bool is_creator_;

public:
    MessageQueueManager(key_t key = MSG_KEY_DEFAULT);
    ~MessageQueueManager();

    // Create message queue
    bool create(bool clean_existing_if_found = true);

    // Open existing message queue
    bool open();

    // Destroy message queue
    bool destroy();

    // Send typed message
    bool send(const EmergencyMessagePayload& payload, long mtype = 1);

    // Receive typed message
    // If non_blocking is true, uses IPC_NOWAIT
    // Returns true on message received, false on error/empty queue
    bool receive(EmergencyMessagePayload& out_payload, long mtype = 0, bool non_blocking = false);

    // Get queue statistics (msg_qnum, msg_qbytes)
    bool get_stats(uint32_t& out_msg_count, uint32_t& out_max_bytes);

    // Accessors
    int get_msgid() const { return msgid_; }
    key_t get_key() const { return key_; }
    bool is_valid() const { return msgid_ != -1; }
};

#endif // MEDSYNC_IPC_MESSAGE_QUEUE_H
