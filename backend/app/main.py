import os
import sys
import time
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (
    EmergencyTriggerRequest,
    RaceExperimentRequest,
    SimulationControlResponse,
    SystemInfoResponse,
    AssignmentRequest,
    ReleaseRequest
)
from .process_manager import manager

app = FastAPI(
    title="MedSync IPC Smart Hospital System API",
    description="Real-Time Orchestration and IPC Event Bridge for Operating Systems Hospital Simulation",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    manager.set_event_loop(asyncio.get_event_loop())
    print("[MEDSYNC BACKEND] FastAPI Server Started on port 8000")

@app.on_event("shutdown")
def shutdown_event():
    print("[MEDSYNC BACKEND] Shutting down C++ simulation processes...")
    manager.stop_simulation()

@app.get("/")
def root():
    return {"status": "ONLINE", "system": "MedSync IPC Smart Hospital Emergency Coordination System", "version": "1.0.0"}

@app.get("/api/system/info")
def get_system_info():
    is_linux = sys.platform.startswith("linux")
    ipc_mode = "Linux System V IPC (shmget, semget, msgget, fork)" if is_linux else "Windows OS Kernel IPC (FileMapping, Semaphore, Process)"
    return {
        "os": sys.platform,
        "ipc_mode": ipc_mode,
        "cpp_executable": manager.executable_path,
        "executable_exists": os.path.exists(manager.executable_path),
        "backend_pid": os.getpid(),
        "simulation_running": manager.is_running,
        "simulation_paused": manager.is_paused,
        "compiler": "GCC 16.1.0 / C++17 (UCRT/POSIX)",
        "linux_compatible": True
    }

@app.get("/api/simulation/state")
def get_simulation_state():
    return manager.get_full_state()

@app.post("/api/simulation/start")
def start_simulation():
    res = manager.start_simulation()
    return res

@app.post("/api/simulation/stop")
def stop_simulation():
    res = manager.stop_simulation()
    return res

@app.post("/api/simulation/pause")
def pause_simulation():
    res = manager.pause_simulation()
    return res

@app.post("/api/simulation/resume")
def resume_simulation():
    res = manager.resume_simulation()
    return res

@app.post("/api/simulation/reset")
def reset_simulation():
    res = manager.reset_data()
    return res

@app.post("/api/simulation/emergency")
def trigger_emergency(req: EmergencyTriggerRequest):
    res = manager.trigger_emergency(req.patient_id, req.priority, req.reason)
    return res

@app.post("/api/race/run")
def run_race_experiment(req: RaceExperimentRequest):
    if req.test_type not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Invalid test_type. Must be 1 (Duplicate Claim), 2 (Lost Counter), or 3 (Conflicting Status).")
    if req.mode not in ("unsafe", "protected"):
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'unsafe' or 'protected'.")

    res = manager.run_race_experiment(req.test_type, req.mode, req.count or 10000)
    return res

@app.get("/api/doctors")
def get_doctors():
    return manager.doctors

@app.get("/api/doctors/{doctor_id}")
def get_doctor(doctor_id: int):
    doc = next((d for d in manager.doctors if d["id"] == doctor_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc

@app.post("/api/assignments/assign")
def assign_doctor_to_patient(req: AssignmentRequest):
    res = manager.assign_doctor_to_patient(req.patient_id, req.doctor_id)
    if res.get("status") in ("NOT_FOUND", "CONFLICT", "ERROR"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.post("/api/assignments/release")
def release_doctor_assignment(req: ReleaseRequest):
    res = manager.release_doctor_assignment(req.doctor_id, req.patient_id)
    if res.get("status") in ("NOT_FOUND", "CONFLICT", "ERROR"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.get("/api/assignments")
def get_assignments():
    state = manager.get_full_state()
    assigned = []
    unassigned = []
    for p in state["patients"]:
        if p["assigned_doctor_id"] != -1:
            doc = next((d for d in state["doctors"] if d["id"] == p["assigned_doctor_id"]), None)
            assigned.append({
                "patient": p,
                "doctor": doc
            })
        else:
            unassigned.append(p)
    return {
        "assigned": assigned,
        "unassigned": unassigned,
        "total_assigned": len(assigned),
        "total_unassigned": len(unassigned)
    }

@app.get("/api/logs")
def get_logs():
    return {
        "events": manager.recent_events,
        "total": len(manager.recent_events)
    }

@app.get("/api/analytics")
def get_analytics():
    state = manager.get_full_state()
    patients = state["patients"]
    
    # Priority breakdown
    priority_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    status_counts = {"Waiting": 0, "Assigned": 0, "In Treatment": 0, "Completed": 0}

    for p in patients:
        prio = p["priority"]
        if prio == 1: priority_counts["Critical"] += 1
        elif prio == 2: priority_counts["High"] += 1
        elif prio == 3: priority_counts["Medium"] += 1
        else: priority_counts["Low"] += 1

        stat = p["treatment_status"]
        if stat == 0: status_counts["Waiting"] += 1
        elif stat == 1: status_counts["Assigned"] += 1
        elif stat == 2: status_counts["In Treatment"] += 1
        else: status_counts["Completed"] += 1

    return {
        "priority_distribution": [
            {"name": "Critical (P1)", "count": priority_counts["Critical"], "color": "#FF4D67"},
            {"name": "High (P2)", "count": priority_counts["High"], "color": "#FFBF69"},
            {"name": "Medium (P3)", "count": priority_counts["Medium"], "color": "#38D9F8"},
            {"name": "Low (P4)", "count": priority_counts["Low"], "color": "#2DD4BF"}
        ],
        "status_distribution": [
            {"name": "Waiting", "value": status_counts["Waiting"], "color": "#FFBF69"},
            {"name": "Assigned", "value": status_counts["Assigned"], "color": "#A78BFA"},
            {"name": "In Treatment", "value": status_counts["In Treatment"], "color": "#38D9F8"},
            {"name": "Completed", "value": status_counts["Completed"], "color": "#2DD4BF"}
        ],
        "vitals_summary": [
            {"id": p["id"], "name": p["name"], "hr": p["heart_rate"], "spo2": p["oxygen_saturation"], "sbp": p["blood_pressure_systolic"]}
            for p in patients
        ],
        "metrics": state["metrics"],
        "race_history": state["race_history"]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    manager.register_websocket(websocket)
    try:
        # Send initial full state immediately
        await websocket.send_json({"event": "INIT_STATE", "data": manager.get_full_state()})
        while True:
            # Keep socket alive and accept ping / control messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.unregister_websocket(websocket)
    except Exception:
        manager.unregister_websocket(websocket)
