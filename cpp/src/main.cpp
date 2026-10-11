#include "../include/controller.h"
#include "../include/race_lab.h"
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    // Check if invoked for a race lab experiment directly
    if (argc >= 2) {
        std::string mode = argv[1];

        if (mode == "--race-duplicate") {
            bool protected_mode = (argc >= 3 && std::string(argv[2]) == "protected");
            RaceConditionLab lab;
            auto res = lab.run_duplicate_assignment_experiment(protected_mode);
            std::cout << RaceConditionLab::result_to_json(res) << std::endl;
            return 0;
        }

        if (mode == "--race-counter") {
            bool protected_mode = (argc >= 3 && std::string(argv[2]) == "protected");
            int count = (argc >= 4) ? std::stoi(argv[3]) : 10000;
            RaceConditionLab lab;
            auto res = lab.run_lost_update_counter_experiment(protected_mode, count);
            std::cout << RaceConditionLab::result_to_json(res) << std::endl;
            return 0;
        }

        if (mode == "--race-status") {
            bool protected_mode = (argc >= 3 && std::string(argv[2]) == "protected");
            RaceConditionLab lab;
            auto res = lab.run_conflicting_status_experiment(protected_mode);
            std::cout << RaceConditionLab::result_to_json(res) << std::endl;
            return 0;
        }

        if (mode == "--dump-state") {
            SharedMemoryManager shm(SHM_KEY_DEFAULT);
            if (shm.attach()) {
                SharedRegistry snap{};
                if (shm.read_snapshot(snap)) {
                    std::cout << "{\"status\":\"OK\",\"patient_count\":" << snap.patient_count 
                              << ",\"version\":" << snap.version_counter << "}" << std::endl;
                    return 0;
                }
            }
            std::cout << "{\"status\":\"NOT_ATTACHED\"}" << std::endl;
            return 1;
        }

        if (mode == "--help" || mode == "-h") {
            std::cout << "MedSync IPC Simulation Engine\n"
                      << "Usage:\n"
                      << "  medsync_sim                   Run full simulation\n"
                      << "  medsync_sim --race-duplicate [unsafe|protected]\n"
                      << "  medsync_sim --race-counter   [unsafe|protected] [increments]\n"
                      << "  medsync_sim --race-status    [unsafe|protected]\n"
                      << "  medsync_sim --dump-state\n";
            return 0;
        }
    }

    // Default: run full simulation engine
    Controller controller("medsync_audit.log");
    if (!controller.initialize_system()) {
        std::cerr << "[FATAL] Failed to initialize MedSync IPC system." << std::endl;
        return 1;
    }

    if (!controller.start_simulation()) {
        std::cerr << "[FATAL] Failed to start simulation workers." << std::endl;
        return 1;
    }

    controller.run_supervisor_loop();
    return 0;
}
