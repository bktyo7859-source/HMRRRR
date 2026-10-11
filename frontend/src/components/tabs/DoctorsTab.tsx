'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Stethoscope,
  Building2,
  Award,
  UserCheck,
  Grid,
  List,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Doctor, Patient, SimulationState } from '../../lib/types';
import { DoctorProfileDrawer } from '../DoctorProfileDrawer';

interface DoctorsTabProps {
  state: SimulationState;
  onRefresh: () => void;
  onSelectPatient?: (patient: Patient) => void;
  onNavigateToAssignments?: () => void;
}

export function DoctorsTab({
  state,
  onRefresh,
  onSelectPatient,
  onNavigateToAssignments,
}: DoctorsTabProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const doctors = state.doctors || [];
  const patients = state.patients || [];

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(doctors.map((d) => d.department).filter(Boolean));
    return Array.from(set);
  }, [doctors]);

  // Specializations list
  const specializations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization || d.specialty).filter(Boolean));
    return Array.from(set);
  }, [doctors]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(search) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(search)) ||
        (doc.role && doc.role.toLowerCase().includes(search)) ||
        (doc.skills && doc.skills.some((s) => s.toLowerCase().includes(search)));

      if (!matchesSearch) return false;
      if (selectedDepartment !== 'ALL' && doc.department !== selectedDepartment) return false;
      if (selectedSpecialty !== 'ALL' && (doc.specialization || doc.specialty) !== selectedSpecialty) return false;
      if (selectedStatus !== 'ALL') {
        const statusCode = Number(selectedStatus);
        if (doc.status !== statusCode) return false;
      }
      if (selectedAssignmentFilter === 'ASSIGNED' && doc.current_patient_id <= 0) return false;
      if (selectedAssignmentFilter === 'UNASSIGNED' && doc.current_patient_id > 0) return false;

      return true;
    });
  }, [doctors, searchQuery, selectedDepartment, selectedSpecialty, selectedStatus, selectedAssignmentFilter]);

  // Statistics
  const availableCount = doctors.filter((d) => d.status === 0).length;
  const busyCount = doctors.filter((d) => d.status === 1).length;
  const totalCount = doctors.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row in Warm Frosted Glass */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 metric-font">
              Doctors &amp; Clinical Staff Directory
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Verified physician credentials, departments, and active patient assignment registry.
          </p>
        </div>

        {/* Operational Metrics Cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">AVAILABLE</span>
              <span className="text-sm font-bold text-stone-900">{availableCount} MDs</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">ATTENDING</span>
              <span className="text-sm font-bold text-stone-900">{busyCount} MDs</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center gap-3">
            <Users className="w-4 h-4 text-stone-400" />
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">TOTAL STAFF</span>
              <span className="text-sm font-bold text-stone-900">{totalCount} MDs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar in Frosted Glass */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor name, specialization, role, or clinical skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/90 border border-stone-200/80 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition shadow-xs"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 self-end lg:self-auto bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Table Directory View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div>
            <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-white text-stone-800 border border-stone-200/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Specialization</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-white text-stone-800 border border-stone-200/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="ALL">All Specialties</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Availability</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white text-stone-800 border border-stone-200/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="0">Available (Triage Ready)</option>
              <option value="1">Attending Patient (Busy)</option>
              <option value="2">On Break</option>
              <option value="3">Off Duty</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">Patient Assignment</label>
            <select
              value={selectedAssignmentFilter}
              onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
              className="w-full bg-white text-stone-800 border border-stone-200/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="ALL">All Staff</option>
              <option value="ASSIGNED">Currently Attending</option>
              <option value="UNASSIGNED">Unassigned / Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Results View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredDoctors.map((doc) => {
            const assignedP = doc.current_patient_id > 0
              ? patients.find((p) => p.id === doc.current_patient_id)
              : null;

            return (
              <div
                key={doc.id}
                className="group rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 hover:border-amber-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer shadow-sm"
                onClick={() => setSelectedDoctor(doc)}
              >
                <div>
                  {/* Portrait Header */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Status badge in corner */}
                    <div className="absolute top-3 left-3">
                      {doc.status === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-emerald-800 border border-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-amber-800 border border-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Attending
                        </span>
                      )}
                    </div>

                    {/* ID badge */}
                    <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/85 text-stone-700 font-semibold border border-white shadow-xs">
                      DOC-0{doc.id}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base font-bold truncate drop-shadow-sm">{doc.name}</h3>
                      <p className="text-xs text-stone-200 truncate">{doc.role}</p>
                    </div>
                  </div>

                  {/* Doctor Profile Body */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5 text-xs text-stone-500">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">Specialty</span>
                        <span className="text-stone-900 font-medium">{doc.specialization}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">Department</span>
                        <span className="text-stone-700">{doc.department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">Experience</span>
                        <span className="text-stone-900 font-medium">{doc.experience} years</span>
                      </div>
                    </div>

                    {/* Assigned Patient Info Chip */}
                    <div className="pt-2 border-t border-stone-100">
                      {assignedP ? (
                        <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100/80 flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <span className="text-[10px] text-amber-700 block font-semibold">ATTENDING PATIENT</span>
                            <span className="font-semibold text-stone-900 truncate block">{assignedP.name}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              assignedP.priority === 1
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            P{assignedP.priority}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100 text-center text-[11px] text-stone-400">
                          Standby for next triage alert
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500 font-mono">
                    {doc.patients_treated_count} treated
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoctor(doc);
                    }}
                    className="text-xs font-semibold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    View Profile
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase font-semibold text-[10px] border-b border-stone-100">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Doctor</th>
                  <th className="py-3.5 px-4 font-medium">Department &amp; Specialty</th>
                  <th className="py-3.5 px-4 font-medium">Experience</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Current Patient</th>
                  <th className="py-3.5 px-4 font-medium">Cases Treated</th>
                  <th className="py-3.5 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDoctors.map((doc) => {
                  const assignedP = doc.current_patient_id > 0
                    ? patients.find((p) => p.id === doc.current_patient_id)
                    : null;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-stone-50/80 transition cursor-pointer"
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={doc.image}
                            alt={doc.name}
                            className="w-10 h-10 rounded-2xl object-cover object-top border border-stone-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                            }}
                          />
                          <div>
                            <span className="font-bold text-stone-800 block">{doc.name}</span>
                            <span className="text-[11px] text-stone-500">{doc.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 block">{doc.specialization}</span>
                        <span className="text-[11px] text-stone-400">{doc.department}</span>
                      </td>

                      <td className="py-3 px-4 text-stone-800 font-mono">
                        {doc.experience} years
                      </td>

                      <td className="py-3 px-4">
                        {doc.status === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Attending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {assignedP ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-800">{assignedP.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                assignedP.priority === 1
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              P{assignedP.priority}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-500">
                        {doc.patients_treated_count}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoctor(doc);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Profile Drawer */}
      <DoctorProfileDrawer
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        allPatients={patients}
        onRefresh={onRefresh}
        onSelectPatient={onSelectPatient}
      />
    </div>
  );
}
