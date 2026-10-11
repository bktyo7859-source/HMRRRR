#ifndef MEDSYNC_COMMON_H
#define MEDSYNC_COMMON_H

#include <cstdint>
#include <cstddef>
#include <sys/types.h>

#if defined(_WIN32)
typedef int key_t;
#else
#include <sys/ipc.h>
#endif

#define MEDSYNC_MAGIC 0x4D454453 // "MEDS"
#define MEDSYNC_SCHEMA_VERSION 1

#define MAX_PATIENTS 10
#define MAX_DOCTORS 8
#define MAX_WORKERS 8

#define SHM_KEY_DEFAULT 0x1234
#define SEM_KEY_DEFAULT 0x1235
#define MSG_KEY_DEFAULT 0x1236

#define RACE_SHM_KEY 0x2234
#define RACE_SEM_KEY 0x2235

// Semaphores indices in the semaphore set
enum SemaphoreIndex {
    SEM_REGISTRY_MUTEX = 0, // Mutex protecting the shared patient & doctor registry
    SEM_EVENT_MUTEX = 1,    // Mutex protecting event counters and logs
    SEM_RACE_MUTEX = 2,     // Mutex used during protected race experiments
    SEM_COUNT = 3
};

// Priority Levels (Standard Emergency Triage)
enum PriorityLevel {
    PRIORITY_CRITICAL = 1, // Red: Immediate resuscitation needed
    PRIORITY_HIGH     = 2, // Amber: Emergent, needs doctor < 15 min
    PRIORITY_MEDIUM   = 3, // Yellow: Urgent
    PRIORITY_LOW      = 4  // Green: Non-urgent
};

// Treatment Statuses
enum TreatmentStatus {
    STATUS_WAITING      = 0, // In emergency queue
    STATUS_ASSIGNED     = 1, // Doctor assigned, awaiting examination
    STATUS_IN_TREATMENT = 2, // Under active procedure
    STATUS_COMPLETED    = 3  // Discharged or transferred to ICU
};

// Doctor Statuses
enum DoctorStatus {
    DOC_AVAILABLE = 0,
    DOC_BUSY      = 1,
    DOC_ON_BREAK  = 2,
    DOC_OFFLINE   = 3
};

// Simulation State
enum SimulationStatus {
    SIM_STOPPED = 0,
    SIM_RUNNING = 1,
    SIM_PAUSED  = 2,
    SIM_ERROR   = 3
};

// Worker Roles
enum WorkerRole {
    ROLE_NONE            = 0,
    ROLE_CONTROLLER      = 1,
    ROLE_PATIENT_MONITOR = 2,
    ROLE_DISPATCHER      = 3,
    ROLE_DOCTOR_1        = 4,
    ROLE_DOCTOR_2        = 5,
    ROLE_DOCTOR_3        = 6,
    ROLE_AUDIT_LOGGER    = 7
};

// Message Types for System V Message Queue
enum MessageType {
    MSG_NONE               = 0,
    MSG_EMERGENCY_ALERT    = 1, // Sent by Patient Monitor to Dispatcher
    MSG_ASSIGNMENT_REQUEST = 2, // Sent by Dispatcher to Doctor Workers
    MSG_ASSIGNMENT_ACK     = 3, // Sent by Doctor to Dispatcher/Logger
    MSG_STATUS_UPDATE      = 4, // Treatment status change
    MSG_AUDIT_EVENT        = 5, // Event to be logged by Audit Logger
    MSG_SHUTDOWN           = 99 // Graceful termination command
};

// Fixed-size, process-safe Patient record
struct PatientRecord {
    int32_t id;
    char name[32];
    int32_t age;
    char condition[48];
    int32_t heart_rate;              // bpm (60-100 normal)
    int32_t blood_pressure_systolic;  // mmHg (90-120 normal)
    int32_t blood_pressure_diastolic; // mmHg (60-80 normal)
    int32_t oxygen_saturation;        // % (95-100 normal)
    int32_t priority;                 // PriorityLevel
    int32_t treatment_status;         // TreatmentStatus
    int32_t assigned_doctor_id;       // -1 if unassigned
    char assigned_doctor_name[32];
    int64_t last_updated_epoch_ms;
    int32_t alert_active;
    char active_alert_message[64];
};

// Fixed-size, process-safe Doctor record
struct DoctorRecord {
    int32_t id;
    char name[32];
    char specialty[32];
    int32_t status;                   // DoctorStatus
    int32_t current_patient_id;       // -1 if none
    int32_t patients_treated_count;
    pid_t worker_pid;
};

// Worker status entry
struct WorkerRecord {
    int32_t role;                     // WorkerRole
    pid_t pid;
    int32_t state;                    // 0: Stopped, 1: Running, 2: Paused, 3: Error
    uint32_t messages_sent;
    uint32_t messages_received;
    uint32_t assignments_successful;
    uint32_t assignments_failed;
    uint32_t lock_acquisitions;
    uint32_t lock_failures;
    int64_t last_heartbeat_epoch_ms;
};

// Signature Race Lab Experiment State
struct RaceLabSharedState {
    int64_t counter_value;
    int64_t counter_target;
    int64_t counter_lost_increments;
    int32_t race_active;
    int32_t race_mode;                // 0: UNSAFE, 1: PROTECTED
    int32_t race_test_type;           // 1: DUPLICATE_ASSIGNMENT, 2: LOST_UPDATE_COUNTER, 3: CONFLICTING_STATUS
    int32_t race_worker1_claimed;
    int32_t race_worker2_claimed;
    int32_t race_invariant_violated;
    int32_t race_start_gate;          // Synchronization barrier
    double race_duration_ms;
};

// Fixed-layout Shared Memory Registry
struct SharedRegistry {
    uint32_t magic;                   // MEDSYNC_MAGIC
    uint32_t schema_version;          // MEDSYNC_SCHEMA_VERSION
    int32_t simulation_status;        // SimulationStatus
    uint64_t version_counter;         // Increment on every atomic modification
    int64_t start_time_epoch_ms;
    uint32_t uptime_seconds;

    // Aggregate counters
    uint32_t total_messages_processed;
    uint32_t total_alerts_generated;
    uint32_t total_assignments_made;
    uint32_t total_synchronization_errors;
    uint32_t critical_patients_count;
    uint32_t available_doctors_count;
    uint32_t active_patients_count;
    uint32_t active_processes_count;

    // Entities
    uint32_t patient_count;
    PatientRecord patients[MAX_PATIENTS];

    uint32_t doctor_count;
    DoctorRecord doctors[MAX_DOCTORS];

    uint32_t worker_count;
    WorkerRecord workers[MAX_WORKERS];

    // Race lab state
    RaceLabSharedState race_state;
};

// Fixed-size message payload for System V Message Queue
struct EmergencyMessagePayload {
    uint32_t version;
    uint32_t message_id;
    int32_t msg_type;                 // MessageType
    int32_t patient_id;
    int32_t doctor_id;
    int32_t priority;
    pid_t sender_pid;
    int64_t timestamp_epoch_ms;
    char text[128];
    int32_t result_code;              // 0: OK, -1: CONFLICT, etc.
};

// Wrapper for msgsnd / msgrcv (mtype must be first long)
struct IpcMessageBuffer {
    long mtype;                       // Target channel or msg type (> 0)
    EmergencyMessagePayload payload;
};

#endif // MEDSYNC_COMMON_H
