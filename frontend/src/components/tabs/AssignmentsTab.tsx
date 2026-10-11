'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Stethoscope,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  UserPlus,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { SimulationState, Patient, Doctor } from '../../lib/types';
import { assignDoctorToPatient, releaseDoctorAssignment } from '../../lib/api';
import { DoctorProfileDrawer } from '../DoctorProfileDrawer';

interface AssignmentsTabProps {
  state: SimulationState;
  onRefresh: () => void;
  onSelectPatient?: (patient: Patient) => void;
}

export function AssignmentsTab({ state, onRefresh, onSelectPatient }: AssignmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ASSIGNED, UNASSIGNED
  const [selectedDoctorForDrawer, setSelectedDoctorForDrawer] = useState<Doctor | null>(null);

  // Quick Assign Modal state
  const [quickAssignPatient, setQuickAssignPatient] = useState<Patient | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const patients = state.patients || [];
  const doctors = state.doctors || [];

  // Helper map of doctors by ID
  const doctorMap = useMemo(() => {
    const map = new Map<number, Doctor>();
    doctors.forEach((d) => map.set(d.id, d));
    return map;
  }, [doctors]);

  // Available doctors list
  const availableDoctors = useMemo(() => {
    return doctors.filter((d) => d.status === 0);
  }, [doctors]);

  // Filtered rows
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search
      const search = searchQuery.toLowerCase();
      const doc = p.assigned_doctor_id > 0 ? doctorMap.get(p.assigned_doctor_id) : null;
      const docName = doc ? doc.name.toLowerCase() : '';
      const docSpec = doc ? doc.specialization.toLowerCase() : '';
      const matchesSearch =
        p.name.toLowerCase().includes(search) ||
        p.condition.toLowerCase().includes(search) ||
        docName.includes(search) ||
        docSpec.includes(search);

      if (!matchesSearch) return false;

      // Priority
      if (priorityFilter !== 'ALL' && p.priority !== Number(priorityFilter)) return false;

      // Assignment status
      if (statusFilter === 'ASSIGNED' && p.assigned_doctor_id <= 0) return false;
      if (statusFilter === 'UNASSIGNED' && p.assigned_doctor_id > 0) return false;

      // Specialty
      if (specialtyFilter !== 'ALL') {
        if (!doc || doc.specialization !== specialtyFilter) return false;
      }

      return true;
    });
  }, [patients, doctorMap, searchQuery, priorityFilter, statusFilter, specialtyFilter]);

  const assignedCount = patients.filter((p) => p.assigned_doctor_id > 0).length;
  const unassignedCount = patients.filter((p) => p.assigned_doctor_id <= 0 && p.treatment_status !== 3).length;
  const criticalUnassigned = patients.filter(
    (p) => p.priority === 1 && p.assigned_doctor_id <= 0 && p.treatment_status !== 3
  ).length;

  const handleQuickAssign = async () => {
    if (!quickAssignPatient || !selectedDoctorId) return;
    setIsAssigning(true);
    setActionMessage(null);
    try {
      await assignDoctorToPatient(quickAssignPatient.id, Number(selectedDoctorId));
      setActionMessage({
        type: 'success',
        text: `Successfully assigned Dr. ${doctorMap.get(Number(selectedDoctorId))?.name} to ${quickAssignPatient.name}`,
      });
      setQuickAssignPatient(null);
      setSelectedDoctorId('');
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Assignment failed' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRelease = async (patient: Patient) => {
    if (patient.assigned_doctor_id <= 0) return;
    setIsAssigning(true);
    setActionMessage(null);
    try {
      await releaseDoctorAssignment(patient.assigned_doctor_id, patient.id);
      setActionMessage({
        type: 'success',
        text: `Released doctor assignment for ${patient.name}`,
      });
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Release failed' });
    } finally {
      setIsAssigning(false);
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F05D69]/20 text-[#F05D69] border border-[#F05D69]/40 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05D69] animate-ping" />
            P1 Critical
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E9AE58]/20 text-[#E9AE58] border border-[#E9AE58]/40 w-fit">
            P2 High
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(211,214,218,0.14)] text-[#F1F2F3] border border-[rgba(230,233,237,0.2)] w-fit">
            P3 Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(211,214,218,0.08)] text-[#B7BBC0] border border-[rgba(230,233,237,0.12)] w-fit">
            P4 Low
          </span>
        );
    }
  };

  const getTreatmentStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E9AE58]/15 text-[#E9AE58] border border-[#E9AE58]/30">
            Awaiting Triage
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(237,239,242,0.16)] text-[#F1F2F3] border border-[rgba(255,255,255,0.24)]">
            Assigned
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(211,214,218,0.12)] text-[#D3D6DA] border border-[rgba(230,233,237,0.18)]">
            In Treatment
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(255,255,255,0.06)] text-[#858B92] border border-[rgba(255,255,255,0.10)]">
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel-dark">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.2)]">
              <UserCheck className="w-5 h-5 text-[#F1F2F3]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#F1F2F3]">
              Doctor–Patient Attendance & Assignment Registry
            </h1>
          </div>
          <p className="text-xs text-[#B7BBC0]">
            Real-time inter-process attendance board answering: <span className="text-[#F1F2F3] font-semibold">Who is attending each emergency patient right now?</span>
          </p>
        </div>

        {/* Real-time counters */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl glass-panel-light border border-[rgba(230,233,237,0.15)] flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F1F2F3]" />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">ATTENDING</span>
              <span className="text-base font-bold text-[#F1F2F3] font-mono">{assignedCount} Cases</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl glass-panel-light border border-[rgba(230,233,237,0.15)] flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${criticalUnassigned > 0 ? 'bg-[#F05D69] animate-ping' : 'bg-[#E9AE58]'}`} />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">UNASSIGNED</span>
              <span className={`text-base font-bold font-mono ${criticalUnassigned > 0 ? 'text-[#F05D69]' : 'text-[#E9AE58]'}`}>
                {unassignedCount} Cases
              </span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl glass-panel-light border border-[rgba(230,233,237,0.15)] flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D3D6DA] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">FREE DOCTORS</span>
              <span className="text-base font-bold text-[#F1F2F3] font-mono">{availableDoctors.length} MDs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'glass-panel-light text-[#F1F2F3] border-[rgba(255,255,255,0.3)]'
              : 'bg-[#F05D69]/15 border-[#F05D69]/40 text-[#F05D69]'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs hover:underline cursor-pointer ml-4 font-mono text-[#B7BBC0]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Critical Unassigned Alert Banner (if any) */}
      {criticalUnassigned > 0 && (
        <div className="p-4 rounded-xl bg-[#F05D69]/10 border border-[#F05D69]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F05D69]/20 text-[#F05D69] shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F05D69]">
                {criticalUnassigned} Critical Emergency Patient{criticalUnassigned > 1 ? 's' : ''} Awaiting Doctor Assignment!
              </h3>
              <p className="text-xs text-[#B7BBC0]">
                Resuscitation telemetry signals urgent attention required. Dispatch an available specialist below.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter('UNASSIGNED');
              setPriorityFilter('1');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F05D69] hover:bg-[#F05D69]/90 text-white transition cursor-pointer shrink-0"
          >
            Filter Critical Unassigned
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel-dark space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#858B92] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name, condition, or assigned doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] placeholder-[#858B92]"
            />
          </div>

          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl glass-btn flex items-center justify-center gap-2 text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#B7BBC0]" />
            Refresh Registry
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Assignment State</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-[#F1F2F3] rounded-xl px-2.5 py-1.5"
            >
              <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Patients</option>
              <option value="ASSIGNED" className="bg-[#191B1E] text-[#F1F2F3]">Currently Assigned & Attended</option>
              <option value="UNASSIGNED" className="bg-[#191B1E] text-[#F1F2F3]">Unassigned / Awaiting Doctor</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Emergency Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full glass-input text-[#F1F2F3] rounded-xl px-2.5 py-1.5"
            >
              <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Priorities</option>
              <option value="1" className="bg-[#191B1E] text-[#F1F2F3]">P1 Critical</option>
              <option value="2" className="bg-[#191B1E] text-[#F1F2F3]">P2 High</option>
              <option value="3" className="bg-[#191B1E] text-[#F1F2F3]">P3 Medium</option>
              <option value="4" className="bg-[#191B1E] text-[#F1F2F3]">P4 Low</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Doctor Specialization</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full glass-input text-[#F1F2F3] rounded-xl px-2.5 py-1.5"
            >
              <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Specializations</option>
              <option value="Emergency Medicine" className="bg-[#191B1E] text-[#F1F2F3]">Emergency Medicine</option>
              <option value="Cardiology" className="bg-[#191B1E] text-[#F1F2F3]">Cardiology</option>
              <option value="Neurology" className="bg-[#191B1E] text-[#F1F2F3]">Neurology</option>
              <option value="Critical Care" className="bg-[#191B1E] text-[#F1F2F3]">Critical Care</option>
              <option value="General Medicine" className="bg-[#191B1E] text-[#F1F2F3]">General Medicine</option>
              <option value="Respiratory Medicine" className="bg-[#191B1E] text-[#F1F2F3]">Respiratory Medicine</option>
              <option value="Trauma Surgery" className="bg-[#191B1E] text-[#F1F2F3]">Trauma Surgery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="rounded-2xl glass-panel-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] uppercase font-mono text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-3 px-4">Patient ID & Name</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Simulated Vitals</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {filteredPatients.map((patient) => {
                const assignedDoc = patient.assigned_doctor_id > 0
                  ? doctorMap.get(patient.assigned_doctor_id)
                  : null;

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-[rgba(211,214,218,0.06)] transition"
                  >
                    {/* Patient ID and Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#B7BBC0]">
                          #P00{patient.id}
                        </span>
                        <button
                          onClick={() => onSelectPatient && onSelectPatient(patient)}
                          className="font-bold text-[#F1F2F3] hover:text-white transition cursor-pointer text-left"
                        >
                          {patient.name}
                        </button>
                      </div>
                      <span className="text-[10px] text-[#858B92]">{patient.age} yrs old</span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(patient.priority)}
                    </td>

                    {/* Vitals Summary */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#858B92] text-[9px] w-6">HR:</span>
                          <span className={`font-semibold ${patient.heart_rate > 110 ? 'text-[#F05D69]' : 'text-[#F1F2F3]'}`}>
                            {patient.heart_rate} bpm
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#858B92] text-[9px] w-6">SpO2:</span>
                          <span className={`font-semibold ${patient.oxygen_saturation < 92 ? 'text-[#F05D69]' : 'text-[#D3D6DA]'}`}>
                            {patient.oxygen_saturation}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Clinical Condition */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-xs text-[#F1F2F3] truncate block">{patient.condition}</span>
                      {patient.active_alert_message && (
                        <span className="text-[10px] text-[#F05D69] truncate block">
                          ⚠ {patient.active_alert_message}
                        </span>
                      )}
                    </td>

                    {/* Attending Doctor (With Portrait!) */}
                    <td className="py-3.5 px-4">
                      {assignedDoc ? (
                        <div
                          className="flex items-center gap-2.5 group cursor-pointer"
                          onClick={() => setSelectedDoctorForDrawer(assignedDoc)}
                        >
                          <img
                            src={assignedDoc.image}
                            alt={assignedDoc.name}
                            className="w-9 h-9 rounded-lg object-cover object-top border border-[rgba(255,255,255,0.24)] group-hover:border-[rgba(255,255,255,0.5)] transition shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                            }}
                          />
                          <div>
                            <span className="font-bold text-[#F1F2F3] group-hover:text-white transition block">
                              {assignedDoc.name}
                            </span>
                            <span className="text-[10px] text-[#858B92] font-mono">
                              DOC-0{assignedDoc.id}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#858B92]">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] border border-dashed border-[rgba(255,255,255,0.15)] flex items-center justify-center">
                            <UserX className="w-4 h-4 text-[#858B92]" />
                          </div>
                          <div>
                            <span className="text-xs text-[#E9AE58] font-medium block">No Doctor Assigned</span>
                            <span className="text-[10px] text-[#858B92]">Unattended</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Doctor Specialty */}
                    <td className="py-3.5 px-4">
                      {assignedDoc ? (
                        <div>
                          <span className="font-medium text-[#F1F2F3] block">{assignedDoc.specialization}</span>
                          <span className="text-[10px] text-[#858B92]">{assignedDoc.department}</span>
                        </div>
                      ) : (
                        <span className="text-[#858B92]/50 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getTreatmentStatusBadge(patient.treatment_status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {assignedDoc ? (
                          <>
                            <button
                              onClick={() => setSelectedDoctorForDrawer(assignedDoc)}
                              className="p-1.5 rounded-xl glass-btn text-[#F1F2F3] transition cursor-pointer"
                              title="View Doctor Profile"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRelease(patient)}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[#F05D69]/15 hover:bg-[#F05D69]/25 text-[#F05D69] border border-[#F05D69]/30 transition cursor-pointer flex items-center gap-1"
                              title="Release Doctor Assignment"
                            >
                              <LogOut className="w-3 h-3" />
                              Release
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setQuickAssignPatient(patient)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold glass-panel-light hover:bg-[rgba(237,239,242,0.22)] text-[#F1F2F3] border border-[rgba(255,255,255,0.24)] transition cursor-pointer flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign Doctor
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {quickAssignPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#101113]/80 backdrop-blur-md"
            onClick={() => setQuickAssignPatient(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl glass-panel-dark-elevated p-6 shadow-2xl z-10 space-y-4 border border-[rgba(255,255,255,0.24)]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#B7BBC0] uppercase tracking-wider">IPC Atomic Triage Dispatch</span>
                <h3 className="text-base font-bold text-[#F1F2F3]">
                  Assign Attending Doctor to {quickAssignPatient.name}
                </h3>
              </div>
              {getPriorityBadge(quickAssignPatient.priority)}
            </div>

            <div className="p-3.5 rounded-xl glass-panel-light text-xs space-y-1">
              <div className="text-[#858B92]">Condition: <span className="text-[#F1F2F3] font-medium">{quickAssignPatient.condition}</span></div>
              <div className="text-[#858B92]">Vitals: <span className="font-mono text-[#F1F2F3]">HR {quickAssignPatient.heart_rate} bpm</span> • <span className="font-mono text-[#D3D6DA]">SpO2 {quickAssignPatient.oxygen_saturation}%</span></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#F1F2F3] block mb-2">
                Select Available Clinical Specialist:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {doctors.map((doc) => {
                  const isAvailable = doc.status === 0;
                  const isSelected = selectedDoctorId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => isAvailable && setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'glass-panel-light-highlight border-[rgba(255,255,255,0.4)] text-[#F1F2F3]'
                          : isAvailable
                          ? 'glass-panel-dark hover:border-[rgba(255,255,255,0.28)] text-[#F1F2F3]'
                          : 'bg-[rgba(38,40,43,0.3)] border-[rgba(255,255,255,0.06)] text-[#858B92]/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-10 h-10 rounded-xl object-cover object-top border border-[rgba(255,255,255,0.18)]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                          }}
                        />
                        <div>
                          <div className="font-bold text-xs text-[#F1F2F3]">{doc.name}</div>
                          <div className="text-[11px] text-[#B7BBC0]">{doc.specialization} • {doc.department}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isAvailable ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.15)]">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F05D69]/20 text-[#F05D69]">
                            Busy (#{doc.current_patient_id})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.10)]">
              <button
                onClick={() => setQuickAssignPatient(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#B7BBC0] hover:text-[#F1F2F3] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAssign}
                disabled={!selectedDoctorId || isAssigning}
                className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel-light hover:bg-[rgba(237,239,242,0.25)] text-[#F1F2F3] border border-[rgba(255,255,255,0.3)] transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#F1F2F3]" />
                Commit IPC Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Drawer */}
      <DoctorProfileDrawer
        doctor={selectedDoctorForDrawer}
        onClose={() => setSelectedDoctorForDrawer(null)}
        allPatients={patients}
        onRefresh={onRefresh}
        onSelectPatient={onSelectPatient}
      />
    </div>
  );
}
