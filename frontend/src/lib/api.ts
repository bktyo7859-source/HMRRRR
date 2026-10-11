const API_BASE = 'http://localhost:8000';

export async function fetchSimulationState() {
  const res = await fetch(`${API_BASE}/api/simulation/state`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function fetchSystemInfo() {
  const res = await fetch(`${API_BASE}/api/system/info`);
  if (!res.ok) throw new Error('Failed to fetch system info');
  return res.json();
}

export async function startSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/start`, { method: 'POST' });
  return res.json();
}

export async function stopSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/stop`, { method: 'POST' });
  return res.json();
}

export async function pauseSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/pause`, { method: 'POST' });
  return res.json();
}

export async function resumeSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/resume`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function triggerManualEmergency(patientId: number, priority: number = 1, reason: string = 'Acute Cardiovascular Crisis') {
  const res = await fetch(`${API_BASE}/api/simulation/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, priority, reason }),
  });
  return res.json();
}

export async function runRaceExperiment(testType: number, mode: 'unsafe' | 'protected', count: number = 10000) {
  const res = await fetch(`${API_BASE}/api/race/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_type: testType, mode, count }),
  });
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/api/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function assignDoctorToPatient(patientId: number, doctorId: number) {
  const res = await fetch(`${API_BASE}/api/assignments/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, doctor_id: doctorId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Assignment transaction failed');
  }
  return res.json();
}

export async function releaseDoctorAssignment(doctorId: number, patientId?: number) {
  const res = await fetch(`${API_BASE}/api/assignments/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctor_id: doctorId, patient_id: patientId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Release assignment failed');
  }
  return res.json();
}

export async function fetchAssignments() {
  const res = await fetch(`${API_BASE}/api/assignments`);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}
