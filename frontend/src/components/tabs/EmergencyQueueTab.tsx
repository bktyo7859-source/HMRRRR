'use client';

import React from 'react';
import { Flame, Clock, Stethoscope, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SimulationState } from '../../lib/types';

interface EmergencyQueueTabProps {
  state: SimulationState;
  onNavigateTab: (tab: any) => void;
}

export function EmergencyQueueTab({ state, onNavigateTab }: EmergencyQueueTabProps) {
  const { patients, doctors, metrics } = state;

  const waitingPatients = patients
    .filter((p) => p.treatment_status === 0)
    .sort((a, b) => a.priority - b.priority);

  const availableDoctors = doctors.filter((d) => d.status === 0);
  const busyDoctors = doctors.filter((d) => d.status === 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#858B92]">Emergency Queue Depth</span>
            <Flame className="h-4 w-4 text-[#F05D69]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F05D69] my-2">
            {waitingPatients.length} <span className="text-xs font-normal text-[#858B92]">patients</span>
          </div>
          <p className="text-[11px] text-[#B7BBC0]">
            {waitingPatients.filter((p) => p.priority === 1).length} Critical (P1) cases awaiting doctor
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#858B92]">Available Resuscitation Docs</span>
            <Stethoscope className="h-4 w-4 text-[#F1F2F3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F1F2F3] my-2">
            {availableDoctors.length} / {doctors.length} <span className="text-xs font-normal text-[#858B92]">ready</span>
          </div>
          <p className="text-[11px] text-[#B7BBC0]">
            {busyDoctors.length} doctors currently in active intervention
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#858B92]">Dispatcher Scheduling Policy</span>
            <Clock className="h-4 w-4 text-[#B7BBC0]" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F1F2F3] my-2">
            STRICT PRIORITY PREEMPTION
          </div>
          <p className="text-[11px] text-[#858B92]">
            P1 (Critical) &gt; P2 (Emergent) &gt; P3 (Urgent) &gt; P4 (Routine)
          </p>
        </div>
      </div>

      {/* Main Split: Triage Queue & Doctor Standby */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Triage Queue */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#E9AE58]" />
                Ranked Emergency Triage Queue
              </h3>
              <p className="text-xs text-[#858B92]">
                Processed by System V Message Queue Dispatcher worker
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-xl glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.18)] font-mono">
              {waitingPatients.length} PENDING
            </span>
          </div>

          <div className="space-y-3">
            {waitingPatients.map((p, index) => {
              const isP1 = p.priority === 1;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isP1
                      ? 'border-[#F05D69]/40 bg-[#F05D69]/10'
                      : 'glass-panel-light border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F1F2F3] flex items-center justify-center font-bold text-xs font-mono">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#F1F2F3]">
                        {p.name}
                        <span className="text-xs text-[#858B92] font-normal ml-2">
                          (Patient #{p.id}, {p.age}y)
                        </span>
                      </div>
                      <p className="text-xs text-[#E9AE58] mt-0.5">{p.condition}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono text-xs">
                      <div className="text-[#F1F2F3]">
                        HR: <span className="text-[#F1F2F3] font-semibold">{p.heart_rate}</span> | SpO2:{' '}
                        <span className="text-[#D3D6DA] font-semibold">{p.oxygen_saturation}%</span>
                      </div>
                      <span className="text-[10px] text-[#858B92]">BP: {p.blood_pressure_systolic}/{p.blood_pressure_diastolic}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                        isP1
                          ? 'bg-[#F05D69] text-white shadow-xs'
                          : p.priority === 2
                          ? 'bg-[#E9AE58]/20 text-[#E9AE58] border border-[#E9AE58]/40'
                          : 'glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      P{p.priority}
                    </span>
                  </div>
                </div>
              );
            })}

            {waitingPatients.length === 0 && (
              <div className="p-12 text-center rounded-xl glass-panel-light border border-dashed border-[rgba(255,255,255,0.15)]">
                <CheckCircle2 className="h-8 w-8 text-[#D3D6DA] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#F1F2F3]">Emergency Queue Clear</h4>
                <p className="text-xs text-[#858B92] mt-1 max-w-sm mx-auto">
                  All patients currently assigned to doctors or stabilized. Trigger a simulated emergency to test dispatcher prioritization.
                </p>
                <button
                  onClick={() => onNavigateTab('patients')}
                  className="mt-4 px-4 py-2 rounded-xl glass-btn text-[#F1F2F3] text-xs font-semibold transition cursor-pointer"
                >
                  Go to Live Patients →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Readiness Pool */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide mb-1 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#F1F2F3]" />
            Doctor Worker Fleet
          </h3>
          <p className="text-xs text-[#858B92] mb-4">
            Independent processes accepting IPC assignments
          </p>

          <div className="space-y-3">
            {doctors.map((doc) => {
              const isAvailable = doc.status === 0;

              return (
                <div
                  key={doc.id}
                  className={`p-3 rounded-xl border transition ${
                    isAvailable
                      ? 'glass-panel-light border-[rgba(255,255,255,0.2)]'
                      : 'bg-[rgba(38,40,43,0.5)] border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-10 h-10 rounded-xl object-cover object-top border border-[rgba(255,255,255,0.2)] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-[#F1F2F3] text-xs truncate">{doc.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                            isAvailable
                              ? 'glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.2)]'
                              : 'bg-[rgba(255,255,255,0.06)] text-[#858B92]'
                          }`}
                        >
                          {isAvailable ? 'AVAILABLE' : 'ATTENDING'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#B7BBC0] truncate">{doc.specialization || doc.specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(255,255,255,0.08)] text-[10px] font-mono text-[#858B92]">
                    <span>Treated: {doc.patients_treated_count}</span>
                    <span>
                      {doc.current_patient_id > 0
                        ? `Patient #${doc.current_patient_id}`
                        : 'Standby'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
