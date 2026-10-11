#include "../include/audit_logger.h"
#include <iostream>
#include <iomanip>
#include <chrono>
#include <thread>

#if defined(_WIN32)
#include <windows.h>
#include <process.h>
#define GETPID() _getpid()
#else
#include <unistd.h>
#define GETPID() getpid()
#endif

AuditLogger::AuditLogger(const std::string& log_filename)
    : pid_(GETPID()), log_filename_(log_filename), running_(false) {}

AuditLogger::~AuditLogger() {
    stop();
    if (log_stream_.is_open()) {
        log_stream_.close();
    }
}

void AuditLogger::stop() {
    running_ = false;
}

void AuditLogger::write_log_entry(const EmergencyMessagePayload& payload) {
    if (!log_stream_.is_open()) {
        log_stream_.open(log_filename_, std::ios::app);
    }

    auto now = std::chrono::system_clock::now();
    std::time_t tt = std::chrono::system_clock::to_time_t(now);
    std::tm tm_buf;
#if defined(_WIN32)
    localtime_s(&tm_buf, &tt);
#else
    localtime_r(&tt, &tm_buf);
#endif

    char time_str[32];
    std::strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", &tm_buf);

    log_stream_ << "[" << time_str << "] "
                << "[PID:" << payload.sender_pid << "] "
                << "[TYPE:" << payload.msg_type << "] "
                << "[PATIENT:" << payload.patient_id << "] "
                << "[RES:" << payload.result_code << "] "
                << payload.text << std::endl;
    log_stream_.flush();
}

void AuditLogger::run() {
    if (!msg_queue_.open()) {
        std::cerr << "[AUDIT LOGGER] Failed to open message queue." << std::endl;
        return;
    }

    pid_ = GETPID();
    running_ = true;
    log_stream_.open(log_filename_, std::ios::app);

    std::cout << "{\"event\":\"WORKER_STARTED\",\"worker\":\"AUDIT_LOGGER\",\"pid\":" << pid_ << "}" << std::endl;

    while (running_) {
        EmergencyMessagePayload payload;
        if (msg_queue_.receive(payload, MSG_AUDIT_EVENT, true)) {
            write_log_entry(payload);
        } else {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }

    std::cout << "{\"event\":\"WORKER_STOPPED\",\"worker\":\"AUDIT_LOGGER\",\"pid\":" << pid_ << "}" << std::endl;
}
