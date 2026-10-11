'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Stethoscope,
  Building2,
  Award,
  UserCheck,
  UserX,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  UserPlus,
  Grid,
  List,
  CheckCircle2,
  Clock,
  ChevronRight,
  HeartPulse,
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
      // Search
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(search) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(search)) ||
        (doc.role && doc.role.toLowerCase().includes(search)) ||
        (doc.skills && doc.skills.some((s) => s.toLowerCase().includes(search)));

      if (!matchesSearch) return false;

      // Department filter
      if (selectedDepartment !== 'ALL' && doc.department !== selectedDepartment) return false;

      // Specialty filter
      if (selectedSpecialty !== 'ALL' && (doc.specialization || doc.specialty) !== selectedSpecialty) return false;

      // Status filter
      if (selectedStatus !== 'ALL') {
        const statusCode = Number(selectedStatus);
        if (doc.status !== statusCode) return false;
      }

      // Assignment status filter
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
      {/* Top Banner & KPI Row in Dark Smoke Glass */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-[rgba(211,214,218,0.12)] text-[#F1F2F3] border border-[rgba(255,255,255,0.18)]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#F1F2F3]">
              Doctors & Clinical Staff Directory
            </h1>
          </div>
          <p className="text-xs text-[#858B92]">
            Verified medical personnel profiles, departmental credentials, and active patient assignment registry.
          </p>
        </div>

        {/* Operational Metrics Cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.12)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#68D391] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">AVAILABLE</span>
              <span className="text-base font-bold text-[#F1F2F3] font-mono">{availableCount} MDs</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.12)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#E2E8F0]" />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">ATTENDING</span>
              <span className="text-base font-bold text-[#F1F2F3] font-mono">{busyCount} MDs</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.12)] flex items-center gap-3">
            <UsersIcon className="w-4 h-4 text-[#858B92]" />
            <div>
              <span className="text-[10px] text-[#858B92] block font-mono">TOTAL STAFF</span>
              <span className="text-base font-bold text-[#F1F2F3] font-mono">{totalCount} MDs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar in Dark Smoke Glass */}
      <div className="p-4 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#858B92] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor name, specialization, role, or clinical skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgba(26,28,30,0.70)] border border-[rgba(230,233,237,0.15)] text-xs text-[#F1F2F3] placeholder-[#858B92] focus:outline-none focus:border-[rgba(255,255,255,0.35)] transition"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 self-end lg:self-auto bg-[rgba(26,28,30,0.70)] p-1 rounded-xl border border-[rgba(230,233,237,0.12)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[rgba(237,239,242,0.20)] text-white font-semibold border border-[rgba(255,255,255,0.28)]'
                  : 'text-[#858B92] hover:text-[#F1F2F3]'
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[rgba(237,239,242,0.20)] text-white font-semibold border border-[rgba(255,255,255,0.28)]'
                  : 'text-[#858B92] hover:text-[#F1F2F3]'
              }`}
              title="Table Directory View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Department */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-[rgba(26,28,30,0.70)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[rgba(255,255,255,0.35)]"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Specialization</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-[rgba(26,28,30,0.70)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[rgba(255,255,255,0.35)]"
            >
              <option value="ALL">All Specialties</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Availability</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[rgba(26,28,30,0.70)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[rgba(255,255,255,0.35)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="0">Available (Triage Ready)</option>
              <option value="1">Attending Patient (Busy)</option>
              <option value="2">On Break</option>
              <option value="3">Off Duty</option>
            </select>
          </div>

          {/* Assignment State */}
          <div>
            <label className="text-[10px] text-[#858B92] uppercase font-mono block mb-1">Patient Assignment</label>
            <select
              value={selectedAssignmentFilter}
              onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
              className="w-full bg-[rgba(26,28,30,0.70)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[rgba(255,255,255,0.35)]"
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
        /* GRID VIEW OF DOCTORS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredDoctors.map((doc) => {
            const assignedP = doc.current_patient_id > 0
              ? patients.find((p) => p.id === doc.current_patient_id)
              : null;

            return (
              <div
                key={doc.id}
                className="group rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] hover:border-[rgba(255,255,255,0.28)] hover:shadow-xl hover:shadow-black/40 transition flex flex-col justify-between overflow-hidden cursor-pointer shadow-md"
                onClick={() => setSelectedDoctor(doc)}
              >
                <div>
                  {/* Portrait Header */}
                  <div className="relative h-44 bg-[#191B1E] overflow-hidden">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,28,31,0.95)] via-transparent to-black/30" />

                    {/* Status badge in corner */}
                    <div className="absolute top-3 left-3">
                      {doc.status === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[rgba(26,28,30,0.80)] backdrop-blur-md text-[#F1F2F3] border border-[rgba(255,255,255,0.20)] shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#68D391] animate-pulse" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[rgba(26,28,30,0.80)] backdrop-blur-md text-[#FFFFFF] border border-[rgba(255,255,255,0.25)] shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
                          Attending
                        </span>
                      )}
                    </div>

                    {/* ID badge in top right */}
                    <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[rgba(26,28,30,0.80)] backdrop-blur-md text-[#B7BBC0] border border-[rgba(230,233,237,0.15)]">
                      DOC-0{doc.id}
                    </div>
                  </div>

                  {/* Doctor Profile Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-[#F1F2F3] group-hover:text-white transition truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-[#B7BBC0] font-medium truncate">{doc.role}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#858B92]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#858B92]">Specialty</span>
                        <span className="text-[#F1F2F3] font-medium">{doc.specialization}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#858B92]">Department</span>
                        <span className="text-[#B7BBC0]">{doc.department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#858B92]">Experience</span>
                        <span className="text-[#F1F2F3] font-medium">{doc.experience} years</span>
                      </div>
                    </div>

                    {/* Assigned Patient Info Chip in Light Smoke Glass */}
                    <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                      {assignedP ? (
                        <div className="p-2 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(255,255,255,0.16)] flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <span className="text-[10px] text-[#858B92] block font-mono">ATTENDING PATIENT</span>
                            <span className="font-semibold text-[#F1F2F3] truncate block">{assignedP.name}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                              assignedP.priority === 1 ? 'bg-[rgba(240,93,105,0.20)] text-[#F05D69]' : 'bg-[rgba(233,174,88,0.20)] text-[#E9AE58]'
                            }`}
                          >
                            P{assignedP.priority}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-[rgba(26,28,30,0.40)] border border-dashed border-[rgba(230,233,237,0.12)] text-center text-[11px] text-[#858B92]">
                          No patient currently assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 py-3 bg-[rgba(26,28,30,0.50)] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#858B92] font-mono">
                    Treated: {doc.patients_treated_count} cases
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoctor(doc);
                    }}
                    className="text-xs font-medium text-[#B7BBC0] group-hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW OF DOCTORS */
        <div className="rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[rgba(26,28,30,0.70)] text-[#858B92] uppercase font-mono text-[10px] border-b border-[rgba(230,233,237,0.15)]">
                <tr>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Department & Specialty</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Patient</th>
                  <th className="py-3.5 px-4">Cases Treated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                {filteredDoctors.map((doc) => {
                  const assignedP = doc.current_patient_id > 0
                    ? patients.find((p) => p.id === doc.current_patient_id)
                    : null;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-[rgba(211,214,218,0.06)] transition cursor-pointer"
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      {/* Doctor info + headshot */}
                      <td className="py-3 px-4">
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
                            <span className="font-bold text-[#F1F2F3] block">{doc.name}</span>
                            <span className="text-[11px] text-[#B7BBC0]">{doc.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department & specialty */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#F1F2F3] block">{doc.specialization}</span>
                        <span className="text-[11px] text-[#858B92]">{doc.department}</span>
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4 text-[#F1F2F3] font-mono">
                        {doc.experience} years
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {doc.status === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[rgba(211,214,218,0.10)] text-[#F1F2F3] border border-[rgba(255,255,255,0.18)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#68D391] animate-pulse" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[rgba(237,239,242,0.16)] text-[#FFFFFF] border border-[rgba(255,255,255,0.25)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
                            Attending
                          </span>
                        )}
                      </td>

                      {/* Current Patient */}
                      <td className="py-3 px-4">
                        {assignedP ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#F1F2F3]">{assignedP.name}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                assignedP.priority === 1
                                  ? 'bg-[rgba(240,93,105,0.20)] text-[#F05D69]'
                                  : 'bg-[rgba(233,174,88,0.20)] text-[#E9AE58]'
                              }`}
                            >
                              P{assignedP.priority}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#858B92] italic">None</span>
                        )}
                      </td>

                      {/* Cases Treated */}
                      <td className="py-3 px-4 font-mono text-[#858B92]">
                        {doc.patients_treated_count}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoctor(doc);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-[rgba(211,214,218,0.10)] hover:bg-[rgba(211,214,218,0.18)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] transition cursor-pointer"
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

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
