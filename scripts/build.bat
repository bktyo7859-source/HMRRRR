@echo off
setlocal
set "PATH=C:\msys64\ucrt64\bin;C:\msys64\usr\bin;%PATH%"
cd /d "%~dp0..\cpp"
echo === Compiling Standalone MedSync C++ IPC Engine ===
g++.exe -std=c++17 -Wall -Wextra -pedantic -O2 -static -static-libgcc -static-libstdc++ -Iinclude src\main.cpp src\shared_memory.cpp src\semaphore.cpp src\message_queue.cpp src\patient_monitor.cpp src\dispatcher.cpp src\doctor_worker.cpp src\audit_logger.cpp src\race_lab.cpp src\controller.cpp -o medsync_sim.exe
if %ERRORLEVEL% EQU 0 (
    echo === Compilation Succeeded: Standalone medsync_sim.exe created! ===
    exit /b 0
) else (
    echo === Compilation Failed with error %ERRORLEVEL% ===
    exit /b %ERRORLEVEL%
)
