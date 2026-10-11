export interface PatientAssignmentHistory {
  doctor_id: number;
  doctor_name: string;
  specialization?: string;
  assigned_at: number;
  completed_at?: number | null;
  duration_seconds?: number;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  oxygen_saturation: number;
  priority: number; // 1: CRITICAL, 2: HIGH, 3: MEDIUM, 4: LOW
  treatment_status: number; // 0: WAITING, 1: ASSIGNED, 2: IN_TREATMENT, 3: COMPLETED
  assigned_doctor_id: number;
  assigned_doctor_name: string;
  assignment_timestamp?: number | null;
  assignment_history?: PatientAssignmentHistory[];
  alert_active: number;
  active_alert_message: string;
  last_updated_epoch_ms: number;
}

export interface DoctorAssignmentHistory {
  patient_id: number;
  patient_name: string;
  department?: string;
  assigned_at: number;
  completed_at?: number | null;
  duration_seconds?: number;
  status?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  specialty?: string;
  role: string;
  experience: number;
  department: string;
  skills: string[];
  bio: string;
  image: string;
  status: number; // 0: AVAILABLE, 1: BUSY / Attending, 2: ON_BREAK, 3: OFFLINE
  current_patient_id: number;
  patients_treated_count: number;
  worker_pid: number;
  assignment_timestamp?: number | null;
  assignment_history?: DoctorAssignmentHistory[];
}

export interface Worker {
  role: number;
  name: string;
  pid: number;
  state: number; // 0: Stopped, 1: Running, 2: Paused, 3: Error
  messages_sent: number;
  messages_received: number;
  assignments_successful: number;
  lock_acquisitions: number;
}

export interface SystemMetrics {
  uptime_seconds: number;
  total_messages: number;
  total_alerts: number;
  total_assignments: number;
  sync_errors: number;
  critical_patients: number;
  available_doctors: number;
  active_processes: number;
}

export interface EventLog {
  id: number;
  timestamp: number;
  source: string;
  event_type: string;
  pid: number;
  patient_id: number;
  result: string;
  description: string;
}

export interface RaceExperimentResult {
  test_type: number;
  mode: 'UNSAFE' | 'PROTECTED';
  target_counter: number;
  actual_counter: number;
  lost_updates: number;
  duration_ms: number;
  worker1_pid: number;
  worker2_pid: number;
  worker1_claimed: number;
  worker2_claimed: number;
  invariant_violated: boolean;
  summary: string;
  details: Record<string, any>;
  timestamp?: number;
}

export interface SimulationState {
  simulation_running: boolean;
  simulation_paused: boolean;
  metrics: SystemMetrics;
  patients: Patient[];
  doctors: Doctor[];
  workers: Worker[];
  recent_events: EventLog[];
  race_history: RaceExperimentResult[];
  system_time: number;
}
