#include "../include/ipc_shared_memory.h"
#include <iostream>
#include <cstring>
#include <chrono>

#if defined(_WIN32)
#include <windows.h>
static HANDLE g_shm_map = NULL;
#endif

SharedMemoryManager::SharedMemoryManager(key_t key)
    : key_(key), shmid_(-1), registry_(nullptr), is_creator_(false) {}

SharedMemoryManager::~SharedMemoryManager() {
    detach();
    if (is_creator_) {
        destroy();
    }
}

bool SharedMemoryManager::create(bool clean_existing_if_found) {
#if defined(_WIN32)
    std::string map_name = "Local\\MedSync_SHM_" + std::to_string(key_);
    if (clean_existing_if_found && g_shm_map) {
        CloseHandle(g_shm_map);
        g_shm_map = NULL;
    }
    g_shm_map = CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 0, sizeof(SharedRegistry), map_name.c_str());
    if (!g_shm_map) {
        std::cerr << "[SHM ERROR] CreateFileMapping failed: " << GetLastError() << std::endl;
        return false;
    }
    registry_ = static_cast<SharedRegistry*>(MapViewOfFile(g_shm_map, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(SharedRegistry)));
    if (!registry_) {
        std::cerr << "[SHM ERROR] MapViewOfFile failed: " << GetLastError() << std::endl;
        return false;
    }
    is_creator_ = true;
    shmid_ = static_cast<int>(key_);
    initialize_registry();
    return true;
#else
    // Linux / POSIX System V Shared Memory
    if (clean_existing_if_found) {
        int existing = shmget(key_, sizeof(SharedRegistry), 0666);
        if (existing >= 0) {
            shmctl(existing, IPC_RMID, nullptr);
        }
    }

    shmid_ = shmget(key_, sizeof(SharedRegistry), IPC_CREAT | IPC_EXCL | 0666);
    if (shmid_ < 0) {
        // Fallback without IPC_EXCL if already created
        shmid_ = shmget(key_, sizeof(SharedRegistry), IPC_CREAT | 0666);
        if (shmid_ < 0) {
            std::cerr << "[SHM ERROR] shmget failed: " << strerror(errno) << " (errno " << errno << ")" << std::endl;
            return false;
        }
    }

    void* ptr = shmat(shmid_, nullptr, 0);
    if (ptr == reinterpret_cast<void*>(-1)) {
        std::cerr << "[SHM ERROR] shmat failed: " << strerror(errno) << std::endl;
        shmid_ = -1;
        return false;
    }

    registry_ = static_cast<SharedRegistry*>(ptr);
    is_creator_ = true;
    initialize_registry();
    return true;
#endif
}

bool SharedMemoryManager::attach() {
#if defined(_WIN32)
    std::string map_name = "Local\\MedSync_SHM_" + std::to_string(key_);
    g_shm_map = OpenFileMappingA(FILE_MAP_ALL_ACCESS, FALSE, map_name.c_str());
    if (!g_shm_map) {
        return false;
    }
    registry_ = static_cast<SharedRegistry*>(MapViewOfFile(g_shm_map, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(SharedRegistry)));
    if (!registry_) {
        return false;
    }
    shmid_ = static_cast<int>(key_);
    return true;
#else
    shmid_ = shmget(key_, sizeof(SharedRegistry), 0666);
    if (shmid_ < 0) {
        return false;
    }

    void* ptr = shmat(shmid_, nullptr, 0);
    if (ptr == reinterpret_cast<void*>(-1)) {
        shmid_ = -1;
        registry_ = nullptr;
        return false;
    }

    registry_ = static_cast<SharedRegistry*>(ptr);
    return true;
#endif
}

bool SharedMemoryManager::detach() {
    if (registry_) {
#if defined(_WIN32)
        UnmapViewOfFile(registry_);
        registry_ = nullptr;
#else
        shmdt(registry_);
        registry_ = nullptr;
#endif
    }
    return true;
}

bool SharedMemoryManager::destroy() {
    detach();
#if defined(_WIN32)
    if (g_shm_map) {
        CloseHandle(g_shm_map);
        g_shm_map = NULL;
    }
    return true;
#else
    if (shmid_ >= 0) {
        int res = shmctl(shmid_, IPC_RMID, nullptr);
        shmid_ = -1;
        return (res == 0);
    }
    return true;
#endif
}

void SharedMemoryManager::initialize_registry() {
    if (!registry_) return;

    std::memset(registry_, 0, sizeof(SharedRegistry));
    registry_->magic = MEDSYNC_MAGIC;
    registry_->schema_version = MEDSYNC_SCHEMA_VERSION;
    registry_->simulation_status = SIM_STOPPED;
    registry_->version_counter = 1;
    
    auto now = std::chrono::system_clock::now();
    registry_->start_time_epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    registry_->uptime_seconds = 0;

    // Initialize 8 initial fictional hospital emergency patients
    registry_->patient_count = 8;
    
    struct DefaultPatient {
        int id;
        const char* name;
        int age;
        const char* condition;
        int hr;
        int sbp;
        int dbp;
        int spo2;
        int priority;
        int status;
    } default_patients[8] = {
        {1, "Sarah Jenkins", 45, "Severe Chest Pain (STEMI suspected)", 115, 145, 95, 94, PRIORITY_CRITICAL, STATUS_WAITING},
        {2, "Robert Vance", 62, "Acute Respiratory Distress (COPD)", 98, 135, 85, 88, PRIORITY_CRITICAL, STATUS_WAITING},
        {3, "Elena Rostova", 28, "Trauma: Motor Vehicle Collision", 125, 90, 55, 96, PRIORITY_CRITICAL, STATUS_WAITING},
        {4, "Marcus Chen", 53, "Diabetic Ketoacidosis Alert", 102, 110, 70, 97, PRIORITY_HIGH, STATUS_WAITING},
        {5, "Ananya Sharma", 34, "Acute Appendicitis / Abdominal Pain", 88, 125, 82, 98, PRIORITY_HIGH, STATUS_WAITING},
        {6, "David Miller", 71, "Suspected Ischemic Stroke", 82, 175, 105, 95, PRIORITY_CRITICAL, STATUS_WAITING},
        {7, "Grace O'Connor", 19, "Severe Allergic Anaphylaxis", 130, 85, 50, 91, PRIORITY_CRITICAL, STATUS_WAITING},
        {8, "James Wilson", 50, "Compound Tibia Fracture", 92, 130, 80, 99, PRIORITY_MEDIUM, STATUS_WAITING}
    };

    for (int i = 0; i < 8; ++i) {
        PatientRecord& p = registry_->patients[i];
        p.id = default_patients[i].id;
        std::strncpy(p.name, default_patients[i].name, sizeof(p.name) - 1);
        p.age = default_patients[i].age;
        std::strncpy(p.condition, default_patients[i].condition, sizeof(p.condition) - 1);
        p.heart_rate = default_patients[i].hr;
        p.blood_pressure_systolic = default_patients[i].sbp;
        p.blood_pressure_diastolic = default_patients[i].dbp;
        p.oxygen_saturation = default_patients[i].spo2;
        p.priority = default_patients[i].priority;
        p.treatment_status = default_patients[i].status;
        p.assigned_doctor_id = -1;
        p.assigned_doctor_name[0] = '\0';
        p.last_updated_epoch_ms = registry_->start_time_epoch_ms;
        p.alert_active = (p.priority == PRIORITY_CRITICAL) ? 1 : 0;
        if (p.alert_active) {
            std::strncpy(p.active_alert_message, "Critical vitals threshold breached", sizeof(p.active_alert_message) - 1);
        }
    }

    // Initialize 8 realistic doctors
    registry_->doctor_count = 8;
    struct DefaultDoctor {
        int id;
        const char* name;
        const char* specialty;
    } default_docs[8] = {
        {1, "Dr. Arjun Mehta", "Emergency Medicine"},
        {2, "Dr. Priya Sharma", "Cardiology"},
        {3, "Dr. Daniel Morgan", "Neurology"},
        {4, "Dr. Sophia Bennett", "Critical Care"},
        {5, "Dr. Kabir Verma", "General Medicine"},
        {6, "Dr. Ananya Rao", "Respiratory Medicine"},
        {7, "Dr. Ethan Cole", "Trauma Surgery"},
        {8, "Dr. Maya Iyer", "Emergency Medicine"}
    };

    for (int i = 0; i < 8; ++i) {
        DoctorRecord& d = registry_->doctors[i];
        d.id = default_docs[i].id;
        std::strncpy(d.name, default_docs[i].name, sizeof(d.name) - 1);
        std::strncpy(d.specialty, default_docs[i].specialty, sizeof(d.specialty) - 1);
        d.status = DOC_AVAILABLE;
        d.current_patient_id = -1;
        d.patients_treated_count = 0;
        d.worker_pid = 0;
    }

    // Workers registry
    registry_->worker_count = MAX_WORKERS;
    for (int i = 0; i < MAX_WORKERS; ++i) {
        registry_->workers[i].role = i;
        registry_->workers[i].pid = 0;
        registry_->workers[i].state = 0;
    }
}

bool SharedMemoryManager::read_snapshot(SharedRegistry& out_snapshot) {
    if (!registry_) return false;
    
    // Read with sequence consistency
    uint64_t v1 = registry_->version_counter;
    std::memcpy(&out_snapshot, registry_, sizeof(SharedRegistry));
    uint64_t v2 = registry_->version_counter;
    
    if (v1 != v2) {
        // Concurrently modified, retry once
        std::memcpy(&out_snapshot, registry_, sizeof(SharedRegistry));
    }
    return true;
}
