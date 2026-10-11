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

  const assignedPatient = doctor.current_patient_id > 0
    ? allPatients.find((p) => p.id === doctor.current_patient_id)
    : null;

  const eligiblePatients = allPatients.filter(
    (p) => p.treatment_status !== 3 && (p.assigned_doctor_id === -1 || p.assigned_doctor_id === doctor.id)
  );

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available for Triage
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Attending Patient
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            On Clinical Break
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
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
        className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel in Warm Frosted Glass */}
      <div className="relative w-full max-w-xl bg-[#FAF6F0]/95 backdrop-blur-2xl border-l border-white shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-stone-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Doctor Profile &amp; Attendance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top Hero: Doctor Portrait & Basic Info */}
          <div className="flex items-start gap-5 p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100 shadow-sm">
              {!imgError && doctor.image ? (
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                  <User className="w-10 h-10 text-stone-400" />
                  <span className="text-[10px] mt-1 font-mono">PORTRAIT</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-bold text-stone-900 truncate">{doctor.name}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                  DOC-0{doctor.id}
                </span>
              </div>
              <p className="text-xs font-medium text-stone-600 mb-2.5">{doctor.role}</p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {getStatusBadge(doctor.status)}
                <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  {doctor.experience} yrs exp
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>{doctor.department}</span>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Clinical Bio & Competencies */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Clinical Summary &amp; Background
            </h4>
            <p className="text-xs leading-relaxed text-stone-700">{doctor.bio}</p>

            <div className="pt-2">
              <div className="text-[11px] font-medium text-stone-500 mb-2">Core Competencies:</div>
              <div className="flex flex-wrap gap-1.5">
                {(doctor.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Current Patient Assignment Section */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                Active Patient Assignment
              </h4>
              <span className="text-[11px] text-stone-500 font-mono">
                {assignedPatient ? '1 Active Case' : '0 Active Cases'}
              </span>
            </div>

            {assignedPatient ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">{assignedPatient.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200">
                        #P00{assignedPatient.id}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">{assignedPatient.condition}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      assignedPatient.priority === 1
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Priority P{assignedPatient.priority}
                  </span>
                </div>

                {/* Vitals snapshot */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-200/60 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-white border border-amber-200/60 text-center">
                    <span className="text-stone-400 block text-[9px]">HEART RATE</span>
                    <span className="font-bold text-stone-900">{assignedPatient.heart_rate} bpm</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200/60 text-center">
                    <span className="text-stone-400 block text-[9px]">SPO2</span>
                    <span className="font-bold text-stone-900">{assignedPatient.oxygen_saturation}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200/60 text-center">
                    <span className="text-stone-400 block text-[9px]">BLOOD PRESS.</span>
                    <span className="font-bold text-stone-900">
                      {assignedPatient.blood_pressure_systolic}/{assignedPatient.blood_pressure_diastolic}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {onSelectPatient && (
                    <button
                      onClick={() => onSelectPatient(assignedPatient)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      View Patient Record
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleRelease}
                    disabled={isSubmitting}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Release Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-3">
                <p className="text-xs text-stone-500">
                  {doctor.name} currently has no active patient assigned.
                </p>

                {/* Assign Workflow */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 max-w-md mx-auto">
                  <select
                    value={assigningPatientId}
                    onChange={(e) => setAssigningPatientId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs bg-white text-stone-800 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
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
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 whitespace-nowrap shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Doctor
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assignment History Log */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Shift Assignment History
            </h4>

            {doctor.assignment_history && doctor.assignment_history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {doctor.assignment_history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <span>{hist.patient_name}</span>
                        <span className="text-[10px] font-mono text-stone-400">#{hist.patient_id}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(hist.assigned_at * 1000).toLocaleTimeString()}
                        {hist.duration_seconds !== undefined && hist.duration_seconds !== null && ` • Duration: ${hist.duration_seconds}s`}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white text-stone-700 border border-stone-200">
                      {hist.status || 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No prior assignment history logged this shift.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
