#ifndef MEDSYNC_AUDIT_LOGGER_H
#define MEDSYNC_AUDIT_LOGGER_H

#include "common.h"
#include "ipc_message_queue.h"
#include <string>
#include <fstream>

class AuditLogger {
private:
    pid_t pid_;
    std::string log_filename_;
    MessageQueueManager msg_queue_;
    bool running_;
    std::ofstream log_stream_;

public:
    AuditLogger(const std::string& log_filename = "medsync_audit.log");
    ~AuditLogger();

    void run();
    void stop();

    void write_log_entry(const EmergencyMessagePayload& payload);
};

#endif // MEDSYNC_AUDIT_LOGGER_H
