import os
import sys
import json
import time
import asyncio
import subprocess
import threading
from typing import Dict, Any, List, Set, Optional
from fastapi import WebSocket

class ProcessManager:
    def __init__(self):
        self.project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.cpp_dir = os.path.join(self.project_root, "cpp")
        
        # Determine executable path
        exe_name = "medsync_sim.exe" if sys.platform == "win32" else "medsync_sim"
        self.executable_path = os.path.join(self.cpp_dir, exe_name)
        
        self.process: Optional[subprocess.Popen] = None
        self.reader_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.is_paused = False
        
        # Re-entrant lock to prevent deadlocks across nested calls and worker threads
        self.lock = threading.RLock()
        self.active_websockets: Set[WebSocket] = set()
        self.event_loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Initial cached patients state with assignment tracking
        self.patients = [
            {"id": 1, "name": "Sarah Jenkins", "age": 45, "condition": "Severe Chest Pain (STEMI suspected)", "heart_rate": 115, "blood_pressure_systolic": 145, "blood_pressure_diastolic": 95, "oxygen_saturation": 94, "priority": 1, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 1, "active_alert_message": "Critical vitals threshold breached", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 2, "name": "Robert Vance", "age": 62, "condition": "Acute Respiratory Distress (COPD)", "heart_rate": 98, "blood_pressure_systolic": 135, "blood_pressure_diastolic": 85, "oxygen_saturation": 88, "priority": 1, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 1, "active_alert_message": "Critical vitals threshold breached", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 3, "name": "Elena Rostova", "age": 28, "condition": "Trauma: Motor Vehicle Collision", "heart_rate": 125, "blood_pressure_systolic": 90, "blood_pressure_diastolic": 55, "oxygen_saturation": 96, "priority": 1, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 1, "active_alert_message": "Critical vitals threshold breached", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 4, "name": "Marcus Chen", "age": 53, "condition": "Diabetic Ketoacidosis Alert", "heart_rate": 102, "blood_pressure_systolic": 110, "blood_pressure_diastolic": 70, "oxygen_saturation": 97, "priority": 2, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 0, "active_alert_message": "", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 5, "name": "Ananya Sharma", "age": 34, "condition": "Acute Appendicitis / Abdominal Pain", "heart_rate": 88, "blood_pressure_systolic": 125, "blood_pressure_diastolic": 82, "oxygen_saturation": 98, "priority": 2, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 0, "active_alert_message": "", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 6, "name": "David Miller", "age": 71, "condition": "Suspected Ischemic Stroke", "heart_rate": 82, "blood_pressure_systolic": 175, "blood_pressure_diastolic": 105, "oxygen_saturation": 95, "priority": 1, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 1, "active_alert_message": "Critical vitals threshold breached", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 7, "name": "Grace O'Connor", "age": 19, "condition": "Severe Allergic Anaphylaxis", "heart_rate": 130, "blood_pressure_systolic": 85, "blood_pressure_diastolic": 50, "oxygen_saturation": 91, "priority": 1, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 1, "active_alert_message": "Critical vitals threshold breached", "last_updated_epoch_ms": int(time.time() * 1000)},
            {"id": 8, "name": "James Wilson", "age": 50, "condition": "Compound Tibia Fracture", "heart_rate": 92, "blood_pressure_systolic": 130, "blood_pressure_diastolic": 80, "oxygen_saturation": 99, "priority": 3, "treatment_status": 0, "assigned_doctor_id": -1, "assigned_doctor_name": "", "assignment_timestamp": None, "assignment_history": [], "alert_active": 0, "active_alert_message": "", "last_updated_epoch_ms": int(time.time() * 1000)}
        ]

        # 8 Authentic Fictional Doctor Profiles
        self.doctors = [
            {
                "id": 1,
                "name": "Dr. Arjun Mehta",
                "specialization": "Emergency Medicine",
                "specialty": "Emergency Medicine",
                "role": "Senior Emergency Physician",
                "experience": 12,
                "department": "Emergency Department",
                "skills": ["Emergency triage", "Trauma assessment", "Acute-care coordination"],
                "bio": "Senior emergency medicine specialist with 12 years of clinical leadership in rapid triage and critical acute resuscitation.",
                "image": "/images/doctors/doctor-arjun-mehta.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 2,
                "name": "Dr. Priya Sharma",
                "specialization": "Cardiology",
                "specialty": "Cardiology",
                "role": "Consultant Cardiologist",
                "experience": 10,
                "department": "Cardiac Care",
                "skills": ["Simulated cardiac emergency assessment", "ECG interpretation workflows", "Cardiac-care coordination"],
                "bio": "Consultant cardiologist directing STEMI protocols, continuous arrhythmia monitoring, and interventional cardiac telemetry.",
                "image": "/images/doctors/doctor-priya-sharma.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 3,
                "name": "Dr. Daniel Morgan",
                "specialization": "Neurology",
                "specialty": "Neurology",
                "role": "Consultant Neurologist",
                "experience": 9,
                "department": "Neurology",
                "skills": ["Neurological assessment", "Stroke-response workflow simulation", "Neurological monitoring"],
                "bio": "Consultant neurologist specializing in rapid-response ischemic stroke protocols, acute neuro-monitoring, and intracranial telemetry.",
                "image": "/images/doctors/doctor-daniel-morgan.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 4,
                "name": "Dr. Sophia Bennett",
                "specialization": "Critical Care",
                "specialty": "Critical Care",
                "role": "Intensive Care Specialist",
                "experience": 11,
                "department": "Critical Care Unit",
                "skills": ["Critical-care coordination", "Escalation workflows", "Simulated intensive-care monitoring"],
                "bio": "Intensive care specialist managing multi-organ failure, invasive hemodynamics, and life-support escalation workflows.",
                "image": "/images/doctors/doctor-sophia-bennett.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 5,
                "name": "Dr. Kabir Verma",
                "specialization": "General Medicine",
                "specialty": "General Medicine",
                "role": "Senior Resident Physician",
                "experience": 6,
                "department": "General Medicine",
                "skills": ["General assessment", "Patient-status documentation", "Clinical coordination"],
                "bio": "Senior resident physician dedicated to inpatient medical admissions, cross-specialty triage, and systematic diagnosis.",
                "image": "/images/doctors/doctor-kabir-verma.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 6,
                "name": "Dr. Ananya Rao",
                "specialization": "Respiratory Medicine",
                "specialty": "Respiratory Medicine",
                "role": "Consultant Pulmonologist",
                "experience": 8,
                "department": "Respiratory Care",
                "skills": ["Respiratory assessment workflows", "Oxygen-saturation monitoring simulation", "Escalation coordination"],
                "bio": "Consultant pulmonologist leading acute hypoxemic distress protocols, mechanical ventilation, and respiratory crisis triage.",
                "image": "/images/doctors/doctor-ananya-rao.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 7,
                "name": "Dr. Ethan Cole",
                "specialization": "Trauma Surgery",
                "specialty": "Trauma Surgery",
                "role": "Trauma Surgery Consultant",
                "experience": 13,
                "department": "Trauma Unit",
                "skills": ["Trauma-response coordination", "Emergency surgical workflow simulation", "Damage-control resuscitation"],
                "bio": "Lead trauma consultant commanding code-red resuscitation bays, operative trauma interventions, and acute triage pathways.",
                "image": "/images/doctors/doctor-ethan-cole.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            },
            {
                "id": 8,
                "name": "Dr. Maya Iyer",
                "specialization": "Emergency Medicine",
                "specialty": "Emergency Medicine",
                "role": "Emergency Physician",
                "experience": 5,
                "department": "Emergency Department",
                "skills": ["Emergency assessment", "Patient handover", "Emergency case documentation"],
                "bio": "Emergency physician specializing in high-speed patient turnover, point-of-care ultrasound, and emergency stabilization.",
                "image": "/images/doctors/doctor-maya-iyer.webp",
                "status": 0,
                "current_patient_id": -1,
                "patients_treated_count": 0,
                "worker_pid": 0,
                "assignment_timestamp": None,
                "assignment_history": []
            }
        ]

        self.workers = [
            {"role": 1, "name": "Controller", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 2, "name": "Patient Monitor", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 3, "name": "Emergency Dispatcher", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 4, "name": "Doctor Worker 1", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 5, "name": "Doctor Worker 2", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 6, "name": "Doctor Worker 3", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0},
            {"role": 7, "name": "Audit Logger", "pid": 0, "state": 0, "messages_sent": 0, "messages_received": 0, "assignments_successful": 0, "lock_acquisitions": 0}
        ]

        self.metrics = {
            "uptime_seconds": 0,
            "total_messages": 0,
            "total_alerts": 6,
            "total_assignments": 0,
            "sync_errors": 0,
            "critical_patients": 5,
            "available_doctors": 8,
            "busy_doctors": 0,
            "active_processes": 0
        }

        self.recent_events: List[Dict[str, Any]] = []
        self.race_test_history: List[Dict[str, Any]] = []

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        self.event_loop = loop

    def register_websocket(self, ws: WebSocket):
        with self.lock:
            self.active_websockets.add(ws)

    def unregister_websocket(self, ws: WebSocket):
        with self.lock:
            self.active_websockets.discard(ws)

    def broadcast_event(self, event_data: Dict[str, Any]):
        if not self.event_loop:
            return
        with self.lock:
            sockets = list(self.active_websockets)
        if not sockets:
            return
        
        msg = json.dumps(event_data)
        for ws in sockets:
            try:
                asyncio.run_coroutine_threadsafe(ws.send_text(msg), self.event_loop)
            except Exception:
                pass

    def start_simulation(self) -> Dict[str, Any]:
        with self.lock:
            if self.is_running and self.process and self.process.poll() is None:
                return {"status": "ALREADY_RUNNING", "message": "Simulation process is already active.", "active": True}

            if not os.path.exists(self.executable_path):
                return {"status": "ERROR", "message": f"Compiled executable not found at {self.executable_path}. Run build first.", "active": False}

            try:
                self.process = subprocess.Popen(
                    [self.executable_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    cwd=self.cpp_dir
                )
                self.is_running = True
                self.is_paused = False

                self.workers[0]["pid"] = self.process.pid
                self.workers[0]["state"] = 1
                self.metrics["active_processes"] = 6

                # Start background stdout reader thread
                self.reader_thread = threading.Thread(target=self._read_process_output, daemon=True)
                self.reader_thread.start()

                pid = self.process.pid
                self._record_event("SYS", "SIMULATION_STARTED", pid, -1, "SUCCESS", f"MedSync simulation engine started (PID: {pid})")

            except Exception as e:
                self.is_running = False
                return {"status": "ERROR", "message": str(e), "active": False}

        event = {
            "event": "SIMULATION_STARTED",
            "status": "RUNNING",
            "pid": pid,
            "timestamp": time.time()
        }
        self.broadcast_event(event)

        return {"status": "SUCCESS", "message": f"Simulation started successfully (PID: {pid})", "active": True}

    def stop_simulation(self) -> Dict[str, Any]:
        with self.lock:
            if not self.is_running or not self.process:
                return {"status": "NOT_RUNNING", "message": "Simulation is not currently active.", "active": False}

            try:
                self.process.terminate()
                try:
                    self.process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    self.process.kill()

                self.is_running = False
                self.is_paused = False
                self.metrics["active_processes"] = 0
                for w in self.workers:
                    w["state"] = 0

                self._record_event("SYS", "SIMULATION_STOPPED", 0, -1, "SUCCESS", "MedSync simulation engine stopped cleanly.")
            except Exception as e:
                return {"status": "ERROR", "message": str(e), "active": False}

        event = {"event": "SIMULATION_STOPPED", "status": "STOPPED", "timestamp": time.time()}
        self.broadcast_event(event)
        return {"status": "SUCCESS", "message": "Simulation stopped cleanly.", "active": False}

    def pause_simulation(self) -> Dict[str, Any]:
        with self.lock:
            self.is_paused = True
            self._record_event("SYS", "SIMULATION_PAUSED", 0, -1, "SUCCESS", "Simulation clock paused.")
        event = {"event": "SIMULATION_PAUSED", "status": "PAUSED", "timestamp": time.time()}
        self.broadcast_event(event)
        return {"status": "SUCCESS", "message": "Simulation paused.", "active": True}

    def resume_simulation(self) -> Dict[str, Any]:
        with self.lock:
            self.is_paused = False
            self._record_event("SYS", "SIMULATION_RESUMED", 0, -1, "SUCCESS", "Simulation clock resumed.")
        event = {"event": "SIMULATION_RESUMED", "status": "RUNNING", "timestamp": time.time()}
        self.broadcast_event(event)
        return {"status": "SUCCESS", "message": "Simulation resumed.", "active": True}

    def reset_data(self) -> Dict[str, Any]:
        self.stop_simulation()
        time.sleep(0.3)
        self.__init__()
        return {"status": "SUCCESS", "message": "Simulation state reset to default hospital baseline.", "active": False}

    def trigger_emergency(self, patient_id: int, priority: int, reason: str) -> Dict[str, Any]:
        with self.lock:
            target_patient = None
            for p in self.patients:
                if p["id"] == patient_id:
                    target_patient = p
                    break
            if not target_patient:
                return {"status": "NOT_FOUND", "message": f"Patient #{patient_id} not found."}

            target_patient["priority"] = priority
            target_patient["alert_active"] = 1
            target_patient["active_alert_message"] = reason
            target_patient["treatment_status"] = 0 # WAITING
            target_patient["assigned_doctor_id"] = -1
            target_patient["assigned_doctor_name"] = ""
            target_patient["last_updated_epoch_ms"] = int(time.time() * 1000)
            
            if priority == 1:
                target_patient["heart_rate"] = 142
                target_patient["oxygen_saturation"] = 87
                target_patient["blood_pressure_systolic"] = 190

            self.metrics["total_alerts"] += 1
            self._record_event("PATIENT_MONITOR", "ALERT_TRIGGERED", 0, patient_id, "CRITICAL", f"Manual emergency triggered: {reason}")
            
        event = {
            "event": "MANUAL_EMERGENCY_TRIGGERED",
            "patient": target_patient,
            "timestamp": time.time()
        }
        self.broadcast_event(event)
        return {"status": "SUCCESS", "message": f"Emergency triggered for {target_patient['name']}.", "patient": target_patient}

    def run_race_experiment(self, test_type: int, mode: str, count: int = 10000) -> Dict[str, Any]:
        flag = "--race-duplicate"
        if test_type == 2:
            flag = "--race-counter"
        elif test_type == 3:
            flag = "--race-status"

        args = [self.executable_path, flag, mode]
        if test_type == 2:
            args.append(str(count))

        try:
            res = subprocess.run(args, capture_output=True, text=True, timeout=15, cwd=self.cpp_dir)
            if res.returncode != 0:
                return {"status": "ERROR", "message": f"C++ test returned exit code {res.returncode}", "raw_stderr": res.stderr}

            output = res.stdout.strip()
            parsed = json.loads(output)
            
            with self.lock:
                self.race_test_history.insert(0, {
                    **parsed,
                    "timestamp": time.time()
                })
                if len(self.race_test_history) > 20:
                    self.race_test_history.pop()

            event = {
                "event": "RACE_EXPERIMENT_COMPLETED",
                "result": parsed,
                "timestamp": time.time()
            }
            self.broadcast_event(event)
            return {"status": "SUCCESS", "result": parsed}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

    def assign_doctor_to_patient(self, patient_id: int, doctor_id: int) -> Dict[str, Any]:
        with self.lock:
            # 1. Does patient exist?
            target_patient = next((p for p in self.patients if p["id"] == patient_id), None)
            if not target_patient:
                return {"status": "NOT_FOUND", "message": f"Patient #{patient_id} does not exist."}

            # 2. Does doctor exist?
            target_doctor = next((d for d in self.doctors if d["id"] == doctor_id), None)
            if not target_doctor:
                return {"status": "NOT_FOUND", "message": f"Doctor #{doctor_id} does not exist."}

            # 3. Patient eligibility check
            if target_patient.get("treatment_status") == 3:
                return {"status": "CONFLICT", "message": f"Patient #{patient_id} ({target_patient['name']}) has already completed emergency care."}

            # 4. Check if patient is already claimed by someone else
            curr_doc_id = target_patient.get("assigned_doctor_id", -1)
            if curr_doc_id != -1 and curr_doc_id != doctor_id:
                curr_doc_name = target_patient.get("assigned_doctor_name", f"Doctor #{curr_doc_id}")
                return {"status": "CONFLICT", "message": f"Patient #{patient_id} is already claimed by {curr_doc_name}. Please release the active assignment first."}

            # 5. Check if doctor is available (Mutual Exclusion)
            if target_doctor.get("status") != 0 and target_doctor.get("current_patient_id") != patient_id:
                return {"status": "CONFLICT", "message": f"{target_doctor['name']} ({target_doctor['role']}) is already attending patient #{target_doctor.get('current_patient_id')}."}

            # 6. Atomic state update
            now_ts = time.time()
            now_ms = int(now_ts * 1000)

            target_doctor["status"] = 1  # BUSY
            target_doctor["current_patient_id"] = patient_id
            target_doctor["assignment_timestamp"] = now_ts
            if "assignment_history" not in target_doctor:
                target_doctor["assignment_history"] = []
            target_doctor["assignment_history"].insert(0, {
                "patient_id": patient_id,
                "patient_name": target_patient["name"],
                "department": target_doctor.get("department", "Emergency"),
                "assigned_at": now_ts,
                "completed_at": None,
                "status": "Attending"
            })

            target_patient["treatment_status"] = 1  # ASSIGNED
            target_patient["assigned_doctor_id"] = doctor_id
            target_patient["assigned_doctor_name"] = target_doctor["name"]
            target_patient["assignment_timestamp"] = now_ts
            target_patient["last_updated_epoch_ms"] = now_ms
            if "assignment_history" not in target_patient:
                target_patient["assignment_history"] = []
            target_patient["assignment_history"].insert(0, {
                "doctor_id": doctor_id,
                "doctor_name": target_doctor["name"],
                "specialization": target_doctor.get("specialization", "Medicine"),
                "assigned_at": now_ts,
                "completed_at": None
            })

            self.metrics["total_assignments"] += 1
            self.metrics["available_doctors"] = len([d for d in self.doctors if d.get("status") == 0])
            self.metrics["busy_doctors"] = len([d for d in self.doctors if d.get("status") == 1])

            self._record_event(
                "DISPATCHER",
                "DOCTOR_ASSIGNED",
                os.getpid(),
                patient_id,
                "SUCCESS",
                f"Atomic Assignment: {target_doctor['name']} ({target_doctor['specialization']}) claimed {target_patient['name']} (Priority P{target_patient['priority']})"
            )

        event = {
            "event": "DOCTOR_ASSIGNED",
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "patient_name": target_patient["name"],
            "doctor_name": target_doctor["name"],
            "specialization": target_doctor.get("specialization"),
            "timestamp": now_ts
        }
        self.broadcast_event(event)

        return {
            "status": "SUCCESS",
            "message": f"Successfully assigned {target_doctor['name']} to {target_patient['name']}.",
            "patient": target_patient,
            "doctor": target_doctor
        }

    def release_doctor_assignment(self, doctor_id: int, patient_id: Optional[int] = None) -> Dict[str, Any]:
        with self.lock:
            target_doctor = next((d for d in self.doctors if d["id"] == doctor_id), None)
            if not target_doctor:
                return {"status": "NOT_FOUND", "message": f"Doctor #{doctor_id} not found."}

            assigned_pid = target_doctor.get("current_patient_id", -1)
            if assigned_pid == -1 and (patient_id is None or patient_id == -1):
                return {"status": "CONFLICT", "message": f"{target_doctor['name']} has no active patient assigned."}

            pid_to_release = patient_id if (patient_id is not None and patient_id != -1) else assigned_pid
            target_patient = next((p for p in self.patients if p["id"] == pid_to_release), None)

            now_ts = time.time()
            now_ms = int(now_ts * 1000)

            # Release doctor
            target_doctor["status"] = 0  # AVAILABLE
            target_doctor["current_patient_id"] = -1
            target_doctor["patients_treated_count"] += 1
            target_doctor["assignment_timestamp"] = None
            if "assignment_history" in target_doctor and target_doctor["assignment_history"]:
                for h in target_doctor["assignment_history"]:
                    if h.get("completed_at") is None and h.get("patient_id") == pid_to_release:
                        h["completed_at"] = now_ts
                        h["duration_seconds"] = int(now_ts - h.get("assigned_at", now_ts))
                        h["status"] = "Completed"

            # Update patient
            patient_name = "Patient"
            if target_patient:
                patient_name = target_patient["name"]
                target_patient["treatment_status"] = 3  # COMPLETED
                target_patient["priority"] = 4  # LOW
                target_patient["alert_active"] = 0
                target_patient["active_alert_message"] = ""
                target_patient["heart_rate"] = 74
                target_patient["blood_pressure_systolic"] = 120
                target_patient["blood_pressure_diastolic"] = 80
                target_patient["oxygen_saturation"] = 99
                target_patient["last_updated_epoch_ms"] = now_ms
                if "assignment_history" in target_patient and target_patient["assignment_history"]:
                    for h in target_patient["assignment_history"]:
                        if h.get("completed_at") is None and h.get("doctor_id") == doctor_id:
                            h["completed_at"] = now_ts
                            h["duration_seconds"] = int(now_ts - h.get("assigned_at", now_ts))

            self.metrics["available_doctors"] = len([d for d in self.doctors if d.get("status") == 0])
            self.metrics["busy_doctors"] = len([d for d in self.doctors if d.get("status") == 1])

            self._record_event(
                "DOCTOR",
                "TREATMENT_COMPLETED",
                os.getpid(),
                pid_to_release,
                "SUCCESS",
                f"Care Completed: {target_doctor['name']} released patient #{pid_to_release} ({patient_name})"
            )

        event = {
            "event": "TREATMENT_COMPLETED",
            "patient_id": pid_to_release,
            "doctor_id": doctor_id,
            "timestamp": now_ts
        }
        self.broadcast_event(event)

        return {
            "status": "SUCCESS",
            "message": f"Successfully released {target_doctor['name']} from patient #{pid_to_release}.",
            "doctor": target_doctor,
            "patient": target_patient
        }

    def _read_process_output(self):
        if not self.process or not self.process.stdout:
            return

        for line in iter(self.process.stdout.readline, ''):
            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)
                self._handle_cpp_event(data)
            except json.JSONDecodeError:
                pass

        self.is_running = False

    def _handle_cpp_event(self, data: Dict[str, Any]):
        event_name = data.get("event")
        now_ms = int(time.time() * 1000)

        with self.lock:
            if event_name == "HEARTBEAT":
                self.metrics["uptime_seconds"] = data.get("uptime", 0)
                self.metrics["critical_patients"] = data.get("critical_count", 0)
                self.metrics["available_doctors"] = data.get("available_docs", 0)
                self.metrics["total_messages"] = data.get("total_messages", 0)
                self.metrics["total_assignments"] = data.get("total_assignments", 0)

            elif event_name == "ALERT_TRIGGERED":
                pid = data.get("patient_id")
                for p in self.patients:
                    if p["id"] == pid:
                        p["priority"] = data.get("priority", 1)
                        p["heart_rate"] = data.get("hr", p["heart_rate"])
                        p["oxygen_saturation"] = data.get("spo2", p["oxygen_saturation"])
                        p["alert_active"] = 1
                        p["active_alert_message"] = data.get("reason", "Threshold breached")
                        p["last_updated_epoch_ms"] = now_ms
                        break
                self.metrics["total_alerts"] += 1
                self._record_event("PATIENT_MONITOR", "ALERT_TRIGGERED", 0, pid, "ALERT", data.get("reason", "Vital threshold breached"))

            elif event_name == "DOCTOR_ASSIGNED":
                pid = data.get("patient_id")
                doc_id = data.get("doctor_id")
                doc_name = ""
                for d in self.doctors:
                    if d["id"] == doc_id:
                        d["status"] = 1 # BUSY
                        d["current_patient_id"] = pid
                        doc_name = d["name"]
                        break
                for p in self.patients:
                    if p["id"] == pid:
                        p["treatment_status"] = 1 # ASSIGNED
                        p["assigned_doctor_id"] = doc_id
                        p["assigned_doctor_name"] = doc_name
                        p["last_updated_epoch_ms"] = now_ms
                        break
                self.metrics["total_assignments"] += 1
                self._record_event("DISPATCHER", "DOCTOR_ASSIGNED", 0, pid, "SUCCESS", f"Assigned {doc_name} to patient #{pid}")

            elif event_name == "TREATMENT_STARTED":
                pid = data.get("patient_id")
                for p in self.patients:
                    if p["id"] == pid:
                        p["treatment_status"] = 2 # IN_TREATMENT
                        p["last_updated_epoch_ms"] = now_ms
                        break
                self._record_event("DOCTOR", "TREATMENT_STARTED", 0, pid, "IN_PROGRESS", f"Doctor began procedure on patient #{pid}")

            elif event_name == "TREATMENT_COMPLETED":
                pid = data.get("patient_id")
                doc_id = data.get("doctor_id")
                for d in self.doctors:
                    if d["id"] == doc_id:
                        d["status"] = 0 # AVAILABLE
                        d["current_patient_id"] = -1
                        d["patients_treated_count"] += 1
                        break
                for p in self.patients:
                    if p["id"] == pid:
                        p["treatment_status"] = 3 # COMPLETED
                        p["priority"] = 4 # LOW/NORMAL
                        p["alert_active"] = 0
                        p["heart_rate"] = 75
                        p["blood_pressure_systolic"] = 120
                        p["blood_pressure_diastolic"] = 80
                        p["oxygen_saturation"] = 99
                        p["active_alert_message"] = ""
                        p["last_updated_epoch_ms"] = now_ms
                        break
                self._record_event("DOCTOR", "TREATMENT_COMPLETED", 0, pid, "SUCCESS", f"Patient #{pid} stabilized and treated successfully.")

            elif event_name == "WORKER_STARTED":
                w_name = data.get("worker", "")
                pid = data.get("pid", 0)
                for w in self.workers:
                    if w_name in w["name"].upper().replace(" ", "_"):
                        w["pid"] = pid
                        w["state"] = 1
                        break
                self._record_event("IPC_KERNEL", "WORKER_FORKED", pid, -1, "SUCCESS", f"Worker {w_name} active (PID: {pid})")

        # Broadcast event to frontend
        self.broadcast_event(data)

    def _record_event(self, source: str, event_type: str, pid: int, patient_id: int, result: str, description: str):
        event_record = {
            "id": len(self.recent_events) + 1,
            "timestamp": time.time(),
            "source": source,
            "event_type": event_type,
            "pid": pid,
            "patient_id": patient_id,
            "result": result,
            "description": description
        }
        self.recent_events.insert(0, event_record)
        if len(self.recent_events) > 100:
            self.recent_events.pop()

    def get_full_state(self) -> Dict[str, Any]:
        with self.lock:
            self.metrics["available_doctors"] = len([d for d in self.doctors if d.get("status") == 0])
            self.metrics["busy_doctors"] = len([d for d in self.doctors if d.get("status") == 1])
            return {
                "simulation_running": self.is_running,
                "simulation_paused": self.is_paused,
                "metrics": self.metrics,
                "patients": self.patients,
                "doctors": self.doctors,
                "workers": self.workers,
                "recent_events": self.recent_events[:25],
                "race_history": self.race_test_history[:10],
                "system_time": time.time()
            }

manager = ProcessManager()
