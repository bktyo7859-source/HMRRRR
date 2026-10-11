'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Flame,
  AlertCircle,
  Clock,
  Heart,
  Droplet,
  Wind,
  CheckCircle2,
  X,
  PlusCircle,
} from 'lucide-react';
import { Patient, Doctor, SimulationState } from '../../lib/types';
import { triggerManualEmergency, assignDoctorToPatient, releaseDoctorAssignment } from '../../lib/api';

interface PatientsTabProps {
  state: SimulationState;
  onRefresh: () => void;
}

export function PatientsTab({ state, onRefresh }: PatientsTabProps) {
  const { patients } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<number | 'ALL'>('ALL');
  
  // Modal states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyTargetId, setEmergencyTargetId] = useState<number>(1);
  const [emergencyPriority, setEmergencyPriority] = useState<number>(1);
  const [emergencyReason, setEmergencyReason] = useState<string>('Acute Cardiac Arrest / STEMI Alert');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || p.treatment_status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleTriggerEmergency = async () => {
    setIsSubmitting(true);
    try {
      await triggerManualEmergency(emergencyTargetId, emergencyPriority, emergencyReason);
      setIsEmergencyModalOpen(false);
      onRefresh();
    } catch (err) {
      alert('Failed to trigger emergency: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F05D69]/20 text-[#F05D69] border border-[#F05D69]/40 font-mono">P1 CRITICAL</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E9AE58]/20 text-[#E9AE58] border border-[#E9AE58]/40 font-mono">P2 HIGH</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(211,214,218,0.14)] text-[#F1F2F3] border border-[rgba(230,233,237,0.2)] font-mono">P3 MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(211,214,218,0.08)] text-[#B7BBC0] border border-[rgba(230,233,237,0.12)] font-mono">P4 LOW</span>;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E9AE58]/15 text-[#E9AE58] border border-[#E9AE58]/30">WAITING</span>;
      case 1:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(237,239,242,0.16)] text-[#F1F2F3] border border-[rgba(255,255,255,0.24)]">ASSIGNED</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(211,214,218,0.12)] text-[#D3D6DA] border border-[rgba(230,233,237,0.18)]">IN TREATMENT</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(255,255,255,0.06)] text-[#858B92] border border-[rgba(255,255,255,0.10)]">COMPLETED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-2xl glass-panel-dark">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#858B92]" />
            <input
              type="text"
              placeholder="Search by patient name or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] placeholder-[#858B92]"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
          >
            <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Priorities</option>
            <option value="1" className="bg-[#191B1E] text-[#F1F2F3]">P1 Critical</option>
            <option value="2" className="bg-[#191B1E] text-[#F1F2F3]">P2 High</option>
            <option value="3" className="bg-[#191B1E] text-[#F1F2F3]">P3 Medium</option>
            <option value="4" className="bg-[#191B1E] text-[#F1F2F3]">P4 Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
          >
            <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Statuses</option>
            <option value="0" className="bg-[#191B1E] text-[#F1F2F3]">Waiting in Queue</option>
            <option value="1" className="bg-[#191B1E] text-[#F1F2F3]">Doctor Assigned</option>
            <option value="2" className="bg-[#191B1E] text-[#F1F2F3]">In Active Treatment</option>
            <option value="3" className="bg-[#191B1E] text-[#F1F2F3]">Completed</option>
          </select>
        </div>

        {/* Manual Emergency Action Button */}
        <button
          onClick={() => setIsEmergencyModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F05D69] hover:bg-[#F05D69]/90 text-white font-semibold text-xs transition shadow-md cursor-pointer"
        >
          <Flame className="h-4 w-4" />
          SIMULATE EMERGENCY EVENT
        </button>
      </div>

      {/* Patient Table */}
      <div className="rounded-2xl glass-panel-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase tracking-wider text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Vitals (Simulated)</th>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-4">Treatment Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {filteredPatients.map((p) => {
                const isCritical = p.priority === 1;
                const isDone = p.treatment_status === 3;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[rgba(211,214,218,0.06)] transition ${
                      isCritical && !isDone ? 'bg-[#F05D69]/5' : ''
                    }`}
                  >
                    {/* Patient Name & Condition */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F1F2F3] text-sm">
                        {p.name}
                        <span className="text-xs text-[#858B92] font-normal ml-2 font-mono">
                          #{p.id} ({p.age}y)
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B7BBC0] truncate max-w-xs mt-0.5">
                        {p.condition}
                      </div>
                    </td>

                    {/* Vitals */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            p.heart_rate >= 130 || p.heart_rate <= 45
                              ? 'text-[#F05D69]'
                              : 'text-[#F1F2F3]'
                          }`}
                          title="Heart Rate"
                        >
                          <Heart className="h-3.5 w-3.5 text-[#858B92]" />
                          {p.heart_rate} bpm
                        </span>

                        <span
                          className={`flex items-center gap-1 ${
                            p.blood_pressure_systolic >= 180
                              ? 'text-[#F05D69]'
                              : 'text-[#858B92]'
                          }`}
                          title="Blood Pressure"
                        >
                          <Droplet className="h-3 w-3 text-[#858B92]" />
                          {p.blood_pressure_systolic}/{p.blood_pressure_diastolic}
                        </span>

                        <span
                          className={`flex items-center gap-1 font-bold ${
                            p.oxygen_saturation <= 90
                              ? 'text-[#F05D69]'
                              : p.oxygen_saturation <= 94
                              ? 'text-[#E9AE58]'
                              : 'text-[#D3D6DA]'
                          }`}
                          title="Oxygen Saturation"
                        >
                          <Wind className="h-3.5 w-3.5 text-[#858B92]" />
                          {p.oxygen_saturation}%
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityBadge(p.priority)}</td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const doc = state.doctors.find((d) => d.id === p.assigned_doctor_id);
                        if (doc) {
                          return (
                            <div className="flex items-center gap-2.5">
                              <img
                                src={doc.image}
                                alt={doc.name}
                                className="w-8 h-8 rounded-lg object-cover object-top border border-[rgba(255,255,255,0.2)] shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <span className="text-[#F1F2F3] font-medium block truncate text-xs">{doc.name}</span>
                                <span className="text-[10px] text-[#B7BBC0] block truncate">
                                  {doc.specialization}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-1.5 text-[#858B92] italic text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E9AE58]" />
                            <span>No doctor assigned</span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(p.treatment_status)}</td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 font-mono text-[#858B92] text-[11px]">
                      {p.last_updated_epoch_ms
                        ? new Date(p.last_updated_epoch_ms).toLocaleTimeString()
                        : 'Initial'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="px-2.5 py-1.5 rounded-xl glass-btn text-[#F1F2F3] text-xs font-medium transition cursor-pointer"
                      >
                        Inspect Vitals
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101113]/80 backdrop-blur-md p-4">
          <div className="glass-panel-dark-elevated rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-[rgba(255,255,255,0.24)]">
            <button
              onClick={() => setSelectedPatient(null)}
              className="absolute right-4 top-4 text-[#858B92] hover:text-[#F1F2F3] p-1.5 rounded-xl glass-btn cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.2)] flex items-center justify-center text-[#F1F2F3]">
                <Heart className="h-5 w-5 text-[#F1F2F3]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F1F2F3]">{selectedPatient.name}</h3>
                <p className="text-xs text-[#858B92]">
                  Patient #{selectedPatient.id} • Age {selectedPatient.age}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-light mb-4">
              <span className="text-[10px] text-[#858B92] uppercase font-mono tracking-wide">Diagnosis:</span>
              <p className="text-sm font-semibold text-[#F1F2F3] mt-0.5">{selectedPatient.condition}</p>
              {selectedPatient.active_alert_message && (
                <div className="mt-2 text-xs text-[#F05D69] bg-[#F05D69]/10 p-2.5 rounded-lg border border-[#F05D69]/30">
                  {selectedPatient.active_alert_message}
                </div>
              )}
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl glass-panel-light text-center">
                <span className="text-[10px] text-[#858B92] font-mono">HEART RATE</span>
                <div className="text-xl font-bold text-[#F1F2F3] font-mono mt-1">
                  {selectedPatient.heart_rate} <span className="text-xs font-normal text-[#858B92]">bpm</span>
                </div>
              </div>
              <div className="p-3 rounded-xl glass-panel-light text-center">
                <span className="text-[10px] text-[#858B92] font-mono">BLOOD PRESSURE</span>
                <div className="text-lg font-bold text-[#E9AE58] font-mono mt-1">
                  {selectedPatient.blood_pressure_systolic}/{selectedPatient.blood_pressure_diastolic}
                </div>
              </div>
              <div className="p-3 rounded-xl glass-panel-light text-center">
                <span className="text-[10px] text-[#858B92] font-mono">OXYGEN SAT</span>
                <div className="text-xl font-bold text-[#D3D6DA] font-mono mt-1">
                  {selectedPatient.oxygen_saturation}%
                </div>
              </div>
            </div>

            {/* Attending Doctor Section */}
            <div className="p-4 rounded-xl glass-panel-light mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#B7BBC0] uppercase tracking-wide">
                  Attending Physician Status
                </span>
                {getStatusBadge(selectedPatient.treatment_status)}
              </div>

              {(() => {
                const doc = state.doctors.find((d) => d.id === selectedPatient.assigned_doctor_id);
                if (doc) {
                  return (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl glass-panel-dark border border-[rgba(255,255,255,0.2)]">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover object-top border border-[rgba(255,255,255,0.24)] shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                          }}
                        />
                        <div>
                          <div className="text-sm font-bold text-[#F1F2F3]">{doc.name}</div>
                          <div className="text-xs text-[#B7BBC0]">{doc.specialization} • {doc.department}</div>
                          <div className="text-[10px] text-[#858B92] mt-0.5 font-mono">
                            Assigned Physician • {doc.experience} yrs exp
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            await releaseDoctorAssignment(doc.id, selectedPatient.id);
                            onRefresh();
                            setSelectedPatient(null);
                          } catch (err: any) {
                            alert(err.message || 'Release failed');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F05D69]/15 hover:bg-[#F05D69]/25 text-[#F05D69] border border-[#F05D69]/30 transition cursor-pointer shrink-0"
                      >
                        Release Doctor
                      </button>
                    </div>
                  );
                }

                // Unassigned state
                return (
                  <div className="p-3.5 rounded-xl glass-panel-dark border border-dashed border-[rgba(255,255,255,0.18)] space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#E9AE58]">
                      <span className="font-semibold">No doctor assigned</span>
                      <span className="text-[10px] text-[#858B92]">Awaiting clinical claim</span>
                    </div>

                    {selectedPatient.treatment_status !== 3 && (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          id="assign-doc-select"
                          className="flex-1 px-2.5 py-1.5 rounded-xl glass-input text-xs text-[#F1F2F3]"
                          defaultValue=""
                        >
                          <option value="" disabled className="bg-[#191B1E] text-[#858B92]">Select available doctor...</option>
                          {state.doctors
                            .filter((d) => d.status === 0)
                            .map((d) => (
                              <option key={d.id} value={d.id} className="bg-[#191B1E] text-[#F1F2F3]">
                                {d.name} ({d.specialization})
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={async () => {
                            const sel = document.getElementById('assign-doc-select') as HTMLSelectElement;
                            if (!sel || !sel.value) return;
                            try {
                              await assignDoctorToPatient(selectedPatient.id, Number(sel.value));
                              onRefresh();
                              setSelectedPatient(null);
                            } catch (err: any) {
                              alert(err.message || 'Assignment failed');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel-light hover:bg-[rgba(237,239,242,0.22)] text-[#F1F2F3] border border-[rgba(255,255,255,0.24)] transition cursor-pointer shrink-0"
                        >
                          Assign Doctor
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Assignment Timeline / History if exists */}
            {selectedPatient.assignment_history && selectedPatient.assignment_history.length > 0 && (
              <div className="p-3.5 rounded-xl glass-panel-light mb-5 space-y-2">
                <span className="text-[10px] font-semibold text-[#858B92] uppercase font-mono">
                  Assignment Timeline & Audit Trail
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
                  {selectedPatient.assignment_history.map((hist, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded-xl glass-panel-dark border border-[rgba(255,255,255,0.08)]">
                      <span className="text-[#F1F2F3] font-medium">{hist.doctor_name}</span>
                      <span className="text-[#858B92] font-mono">
                        {new Date(hist.assigned_at * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.10)]">
              <button
                onClick={() => {
                  setEmergencyTargetId(selectedPatient.id);
                  setIsEmergencyModalOpen(true);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#F05D69] hover:bg-[#F05D69]/90 text-white font-medium text-xs transition cursor-pointer"
              >
                Trigger Emergency on this Patient
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl glass-btn text-[#B7BBC0] hover:text-[#F1F2F3] font-medium text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Emergency Simulation Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101113]/80 backdrop-blur-md p-4">
          <div className="glass-panel-dark-elevated rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-[rgba(255,255,255,0.24)]">
            <button
              onClick={() => setIsEmergencyModalOpen(false)}
              className="absolute right-4 top-4 text-[#858B92] hover:text-[#F1F2F3] p-1.5 rounded-xl glass-btn cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#F05D69]/20 border border-[#F05D69]/40 flex items-center justify-center text-[#F05D69]">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F2F3]">Simulate Emergency Event</h3>
                <p className="text-xs text-[#858B92]">Dispatches actual System V Message Queue Alert</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#858B92] block mb-1">Target Patient:</label>
                <select
                  value={emergencyTargetId}
                  onChange={(e) => setEmergencyTargetId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#191B1E] text-[#F1F2F3]">
                      #{p.id} - {p.name} ({p.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#858B92] block mb-1">Triage Priority:</label>
                <select
                  value={emergencyPriority}
                  onChange={(e) => setEmergencyPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
                >
                  <option value="1" className="bg-[#191B1E] text-[#F1F2F3]">Priority 1 (Critical - Immediate Resuscitation)</option>
                  <option value="2" className="bg-[#191B1E] text-[#F1F2F3]">Priority 2 (High - Emergent Care)</option>
                  <option value="3" className="bg-[#191B1E] text-[#F1F2F3]">Priority 3 (Medium - Urgent Care)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#858B92] block mb-1">Crisis Description:</label>
                <input
                  type="text"
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3]"
                />
              </div>

              <div className="p-3.5 rounded-xl glass-panel-light text-[11px] text-[#B7BBC0] leading-relaxed border border-[rgba(255,255,255,0.12)]">
                <span className="text-[#F1F2F3] font-semibold">IPC Execution Note:</span> This creates a typed{' '}
                <code className="text-[#F1F2F3] font-mono bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded">MSG_EMERGENCY_ALERT</code> in Linux System V message queue.{' '}
                The dispatcher worker will pop the message and atomically assign an available doctor using semaphores.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-[rgba(255,255,255,0.10)]">
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-xl glass-btn text-[#B7BBC0] hover:text-[#F1F2F3] font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerEmergency}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#F05D69] hover:bg-[#F05D69]/90 text-white font-semibold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Dispatching IPC Alert...' : 'Dispatch Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
