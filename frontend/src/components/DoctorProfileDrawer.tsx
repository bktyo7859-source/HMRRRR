'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Clock,
  Award,
  Building2,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogOut,
  Calendar,
  FileText,
} from 'lucide-react';
import { Doctor, Patient } from '../lib/types';
import { assignDoctorToPatient, releaseDoctorAssignment } from '../lib/api';

interface DoctorProfileDrawerProps {
  doctor: Doctor | null;
  onClose: () => void;
  allPatients: Patient[];
  onRefresh: () => void;
  onSelectPatient?: (patient: Patient) => void;
}

export function DoctorProfileDrawer({
  doctor,
  onClose,
  allPatients,
  onRefresh,
  onSelectPatient,
}: DoctorProfileDrawerProps) {
  const [assigningPatientId, setAssigningPatientId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!doctor) return null;

  // Find currently assigned patient
  const assignedPatient = doctor.current_patient_id > 0
    ? allPatients.find((p) => p.id === doctor.current_patient_id)
    : null;

  // Available patients eligible for assignment
  const eligiblePatients = allPatients.filter(
    (p) => p.treatment_status !== 3 && (p.assigned_doctor_id === -1 || p.assigned_doctor_id === doctor.id)
  );

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(211,214,218,0.12)] text-[#F1F2F3] border border-[rgba(255,255,255,0.22)] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#68D391] animate-pulse" />
            Available for Triage
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(237,239,242,0.18)] text-[#FFFFFF] border border-[rgba(255,255,255,0.30)] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
            Attending Patient
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(233,174,88,0.15)] text-[#E9AE58] border border-[rgba(233,174,88,0.30)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9AE58]" />
            On Clinical Break
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(211,214,218,0.08)] text-[#858B92] border border-[rgba(230,233,237,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#858B92]" />
            Off Duty
          </span>
        );
    }
  };

  const handleAssign = async () => {
    if (!assigningPatientId) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await assignDoctorToPatient(Number(assigningPatientId), doctor.id);
      setActionSuccess(`Successfully assigned to Patient #${assigningPatientId}`);
      setAssigningPatientId('');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!assignedPatient) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await releaseDoctorAssignment(doctor.id, assignedPatient.id);
      setActionSuccess(`Completed care and released assignment for ${assignedPatient.name}`);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to release patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#101113]/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel in Dark Smoke Glass */}
      <div className="relative w-full max-w-xl bg-[rgba(26,28,31,0.85)] backdrop-blur-2xl border-l border-[rgba(255,255,255,0.18)] shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[rgba(38,40,43,0.75)] backdrop-blur-xl border-b border-[rgba(230,233,237,0.15)]">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-[#F1F2F3]" />
            <h2 className="text-base font-semibold text-[#F1F2F3] tracking-wide">Doctor Profile & Attendance</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#B7BBC0] hover:text-[#FFFFFF] bg-[rgba(211,214,218,0.08)] hover:bg-[rgba(211,214,218,0.16)] border border-[rgba(230,233,237,0.12)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top Hero: Doctor Portrait & Basic Info in Dark Smoke Glass */}
          <div className="flex items-start gap-5 p-4 rounded-xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 border border-[rgba(255,255,255,0.24)] bg-[#191B1E] shadow-sm">
              {!imgError && doctor.image ? (
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#191B1E] text-[#B7BBC0]">
                  <User className="w-10 h-10 text-[#B7BBC0]" />
                  <span className="text-[10px] mt-1 font-mono">PORTRAIT</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#F1F2F3] truncate">{doctor.name}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[rgba(211,214,218,0.10)] border border-[rgba(230,233,237,0.15)] text-[#F1F2F3]">
                  DOC-0{doctor.id}
                </span>
              </div>
              <p className="text-xs font-medium text-[#B7BBC0] mb-2.5">{doctor.role}</p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {getStatusBadge(doctor.status)}
                <span className="inline-flex items-center gap-1 text-xs text-[#B7BBC0] bg-[rgba(211,214,218,0.08)] px-2 py-0.5 rounded-md border border-[rgba(230,233,237,0.12)]">
                  <Award className="w-3.5 h-3.5 text-[#E2E8F0]" />
                  {doctor.experience} yrs exp
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#858B92]">
                <Building2 className="w-3.5 h-3.5 text-[#B7BBC0]" />
                <span>{doctor.department}</span>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionError && (
            <div className="p-3 rounded-xl bg-[rgba(240,93,105,0.14)] border border-[rgba(240,93,105,0.30)] flex items-start gap-2 text-xs text-[#F05D69]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-[rgba(211,214,218,0.14)] border border-[rgba(255,255,255,0.25)] flex items-start gap-2 text-xs text-[#F1F2F3]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#68D391]" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Specialization & Clinical Bio */}
          <div className="p-4 rounded-xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B7BBC0] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#F1F2F3]" />
              Clinical Summary & Background
            </h4>
            <p className="text-xs leading-relaxed text-[#F1F2F3]/90">{doctor.bio}</p>

            <div className="pt-2">
              <div className="text-[11px] font-medium text-[#858B92] mb-2">Core Competencies & Protocols:</div>
              <div className="flex flex-wrap gap-1.5">
                {(doctor.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[rgba(211,214,218,0.08)] text-[#F1F2F3] border border-[rgba(230,233,237,0.12)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Current Patient Assignment Section */}
          <div className="p-4 rounded-xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B7BBC0] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#F1F2F3]" />
                Active Patient Assignment
              </h4>
              <span className="text-[11px] text-[#858B92] font-mono">
                {assignedPatient ? '1 Active Case' : '0 Active Cases'}
              </span>
            </div>

            {assignedPatient ? (
              <div className="p-3.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(255,255,255,0.18)] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F1F2F3]">{assignedPatient.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(211,214,218,0.10)] text-[#B7BBC0]">
                        #P00{assignedPatient.id}
                      </span>
                    </div>
                    <p className="text-xs text-[#858B92] mt-0.5">{assignedPatient.condition}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      assignedPatient.priority === 1
                        ? 'bg-[rgba(240,93,105,0.20)] text-[#F05D69] border border-[rgba(240,93,105,0.30)]'
                        : assignedPatient.priority === 2
                        ? 'bg-[rgba(233,174,88,0.20)] text-[#E9AE58] border border-[rgba(233,174,88,0.30)]'
                        : 'bg-[rgba(211,214,218,0.12)] text-[#F1F2F3] border border-[rgba(255,255,255,0.18)]'
                    }`}
                  >
                    Priority P{assignedPatient.priority}
                  </span>
                </div>

                {/* Vitals snapshot in Light Smoke Glass */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[rgba(255,255,255,0.08)] text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-[rgba(211,214,218,0.06)] border border-[rgba(230,233,237,0.10)] text-center">
                    <span className="text-[#858B92] block text-[9px]">HEART RATE</span>
                    <span className="font-bold text-[#F1F2F3]">{assignedPatient.heart_rate} bpm</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(211,214,218,0.06)] border border-[rgba(230,233,237,0.10)] text-center">
                    <span className="text-[#858B92] block text-[9px]">SPO2</span>
                    <span className="font-bold text-[#F1F2F3]">{assignedPatient.oxygen_saturation}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(211,214,218,0.06)] border border-[rgba(230,233,237,0.10)] text-center">
                    <span className="text-[#858B92] block text-[9px]">BLOOD PRESS.</span>
                    <span className="font-bold text-[#F1F2F3]">
                      {assignedPatient.blood_pressure_systolic}/{assignedPatient.blood_pressure_diastolic}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {onSelectPatient && (
                    <button
                      onClick={() => onSelectPatient(assignedPatient)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-[rgba(211,214,218,0.10)] hover:bg-[rgba(211,214,218,0.18)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      View Patient Record
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleRelease}
                    disabled={isSubmitting}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[rgba(240,93,105,0.15)] hover:bg-[rgba(240,93,105,0.25)] text-[#F05D69] border border-[rgba(240,93,105,0.30)] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Release Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[rgba(26,28,30,0.50)] border border-dashed border-[rgba(230,233,237,0.15)] text-center space-y-3">
                <p className="text-xs text-[#858B92]">
                  {doctor.name} currently has no active patient assigned.
                </p>

                {/* Assign Workflow */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 max-w-md mx-auto">
                  <select
                    value={assigningPatientId}
                    onChange={(e) => setAssigningPatientId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs bg-[rgba(26,28,30,0.80)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[rgba(255,255,255,0.35)]"
                  >
                    <option value="">Select an awaiting patient...</option>
                    {eligiblePatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} — {p.name} (P{p.priority} • {p.condition.substring(0, 24)}...)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssign}
                    disabled={!assigningPatientId || isSubmitting}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(237,239,242,0.18)] hover:bg-[rgba(237,239,242,0.28)] text-white border border-[rgba(255,255,255,0.28)] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Doctor
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assignment History Log */}
          <div className="p-4 rounded-xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B7BBC0] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F1F2F3]" />
              Assignment History & Audit Trail
            </h4>

            {doctor.assignment_history && doctor.assignment_history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {doctor.assignment_history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.12)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#F1F2F3] flex items-center gap-1.5">
                        <span>{hist.patient_name}</span>
                        <span className="text-[10px] font-mono text-[#858B92]">#{hist.patient_id}</span>
                      </div>
                      <span className="text-[10px] text-[#858B92]">
                        {new Date(hist.assigned_at * 1000).toLocaleTimeString()}
                        {hist.duration_seconds !== undefined && hist.duration_seconds !== null && ` • Duration: ${hist.duration_seconds}s`}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[rgba(211,214,218,0.10)] text-[#F1F2F3] border border-[rgba(230,233,237,0.12)]">
                      {hist.status || 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#858B92] italic">No prior assignment history logged this shift.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
