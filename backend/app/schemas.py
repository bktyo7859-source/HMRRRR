from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EmergencyTriggerRequest(BaseModel):
    patient_id: int
    priority: int = 1
    reason: str = "Simulated Acute Cardiac Crisis"

class RaceExperimentRequest(BaseModel):
    test_type: int = Field(..., description="1: Duplicate Claim, 2: Lost-Update Counter, 3: Conflicting Status")
    mode: str = Field("unsafe", description="'unsafe' or 'protected'")
    count: Optional[int] = 10000

class SimulationControlResponse(BaseModel):
    status: str
    message: str
    active: bool

class AssignmentRequest(BaseModel):
    patient_id: int
    doctor_id: int

class ReleaseRequest(BaseModel):
    doctor_id: int
    patient_id: Optional[int] = None

class SystemInfoResponse(BaseModel):
    os: str
    ipc_mode: str
    cpp_executable: str
    backend_pid: int
    simulation_running: bool
    compiler: str
