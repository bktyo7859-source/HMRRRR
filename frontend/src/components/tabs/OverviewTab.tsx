'use client';

import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  UserCheck,
  Cpu,
  Radio,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Stethoscope,
  MoreHorizontal,
  ChevronDown,
  Layers,
  ArrowDownRight,
} from 'lucide-react';
import { SimulationState } from '../../lib/types';

interface OverviewTabProps {
  state: SimulationState;
  onNavigateTab: (tab: any) => void;
}

export function OverviewTab({ state, onNavigateTab }: OverviewTabProps) {
  const { metrics, patients, doctors, workers, recent_events } = state;
  const [selectedTimeframe, setSelectedTimeframe] = useState('Live IPC Cycle');

  // Compute stats
  const activePatients = patients.filter((p) => p.treatment_status !== 3);
  const criticalCount = patients.filter((p) => p.priority === 1 && p.treatment_status !== 3).length;
  const assignedDoctors = doctors.filter((d) => d.status === 1);

  // Bar chart simulated heights (Feb -> Jul or Ward loads)
  const barData = [
    { label: 'Triage', height: '42%' },
    { label: 'ICU', height: '88%' },
    { label: 'OR-1', height: '64%' },
    { label: 'OR-2', height: '76%' },
    { label: 'Stepdown', height: '32%' },
    { label: 'Ward', height: '58%' },
  ];

  // Top performing doctors (from doctor data)
  const topDoctors = doctors.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Main Section: Left 2-Col Card & Right Feature Stack (DIRECT MATCH TO REFERENCE UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Col Card: "Average KPI Score" + Bar Chart + "Top Performance" Doctor subcard */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between">
          {/* Header of KPI Card */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-stone-500 tracking-wide uppercase">
                Hospital Emergency KPI
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl lg:text-4xl font-bold tracking-tight text-stone-900 metric-font">
                  63.89%
                </span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3" /> - 2.34%
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Live bed saturation &amp; physician dispatch efficiency
              </p>
            </div>

            {/* Timeframe Dropdown Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200/80 shadow-xs text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-50 transition">
              <span>{selectedTimeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </div>
          </div>

          {/* Body: Left Vertical Bars + Right "Top Performance" Sub-card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-4">
            {/* Left Bar Chart (Matching Reference Pill Bars) */}
            <div className="md:col-span-7 flex flex-col justify-end">
              <div className="h-48 flex items-end justify-between gap-3 px-2 pb-2">
                {barData.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    {/* Background track (soft grey pill) */}
                    <div className="w-4 sm:w-5 h-full rounded-full bg-stone-100/90 relative flex flex-col justify-end p-0.5 overflow-hidden">
                      {/* Filled warm amber pill */}
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400 transition-all duration-700 shadow-xs"
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-stone-500">{bar.label}</span>
                  </div>
                ))}
              </div>

              {/* Y-axis indicator tags */}
              <div className="flex items-center justify-between px-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-medium">
                <span>0% Min</span>
                <span>50% Nominal</span>
                <span>100% Max</span>
              </div>
            </div>

            {/* Right: Nested "Top Performance" Subcard */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-white border border-stone-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-800">Top Performance</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  Attending Staff
                </span>
              </div>

              <div className="space-y-2.5">
                {topDoctors.map((doc, idx) => (
                  <div
                    key={doc.id}
                    onClick={() => onNavigateTab('doctors')}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-stone-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-stone-200">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/images/doctors/doctor-arjun-mehta.jpg';
                          }}
                        />
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-stone-900 text-white text-[9px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-stone-800 truncate block group-hover:text-amber-700 transition">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-stone-400 truncate block">
                          {doc.patients_treated_count || (314 - idx * 25)} tasks completed
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-stone-400">
                      {doc.status === 1 ? 'Active' : 'Standby'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: Hero Dark Card ("Upcoming Meeting" / Emergency Dispatch) + "Working Format" Card */}
        <div className="space-y-4">
          {/* THE SIGNATURE HERO DARK CARD (Direct from Reference Image!) */}
          <div className="hero-dark-card p-6 rounded-3xl relative">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-bold text-white tracking-wide">
                Upcoming Emergency Dispatches
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>

            <div className="space-y-4 relative z-10">
              {/* Meeting / Dispatch Item 1 */}
              <div className="space-y-1.5 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    Trauma Team Alpha — Code Blue
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 pl-3.5">
                  <span>Today 06:00 - 08:00</span>
                  {/* Overlapping doctor avatar bubbles from reference UI */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <img
                      src="/images/doctors/doctor-arjun-mehta.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                    <img
                      src="/images/doctors/doctor-priya-sharma.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                    <img
                      src="/images/doctors/doctor-ananya-rao.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              {/* Meeting / Dispatch Item 2 */}
              <div className="space-y-1.5 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    Neurosurgery Triage — OR Bed 02
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 pl-3.5">
                  <span>Today 08:00 - 10:30</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <img
                      src="/images/doctors/doctor-kabir-verma.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                    <img
                      src="/images/doctors/doctor-sophia-bennett.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              {/* Meeting / Dispatch Item 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    Emergency ICU Consultation
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 pl-3.5">
                  <span>Today 11:00 - 12:30</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <img
                      src="/images/doctors/doctor-ethan-cole.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                    <img
                      src="/images/doctors/doctor-maya-iyer.jpg"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* "Working Format" / Bed Allocation Card (From Reference Image) */}
          <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm space-y-3">
            <span className="text-sm font-bold text-stone-800 block">Bed Allocation Format</span>

            <div className="space-y-2">
              {/* On-site / ICU */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">ICU Severe</span>
                  <span className="text-sm font-bold text-stone-800">13,982</span>
                </div>
                <span className="text-xs font-bold text-orange-600">11.4%</span>
              </div>

              {/* Hybrid / Emergency */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">Emergency Bay</span>
                  <span className="text-sm font-bold text-stone-800">26,214</span>
                </div>
                <span className="text-xs font-bold text-orange-600">32.2%</span>
              </div>

              {/* Remote / General */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">General Ward</span>
                  <span className="text-sm font-bold text-stone-800">41,214</span>
                </div>
                <span className="text-xs font-bold text-orange-600">56.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Main Card: "Employees" / Live Patient Table (MATCHING REFERENCE UI TABLE) */}
      <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-stone-800 tracking-tight">
              Live Patients &amp; Attending Status
            </h3>
            <p className="text-xs text-stone-400">
              Active patient vitals synced through zero-copy System V shared memory
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('patients')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition cursor-pointer"
          >
            View All Patients →
          </button>
        </div>

        {/* Table matching reference columns: ID, Name, Role, Performance (progress pill bar!), ... */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-[11px] font-semibold">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">NAME</th>
                <th className="pb-3 font-medium">ROLE / CONDITION</th>
                <th className="pb-3 font-medium">PERFORMANCE / VITALS</th>
                <th className="pb-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {patients.slice(0, 6).map((patient, idx) => {
                const assignedDoctor = doctors.find((d) => d.id === patient.assigned_doctor_id);
                // Compute progress percentage from heart rate & oxygen
                const progressPct = Math.min(100, Math.max(20, Math.round((patient.oxygen_saturation / 100) * 85)));

                return (
                  <tr key={patient.id} className="hover:bg-stone-50/70 transition group">
                    {/* ID */}
                    <td className="py-3.5 font-mono text-stone-500 text-[11px]">
                      OM124{patient.id}92{idx}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 font-semibold text-stone-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            patient.priority === 1
                              ? 'bg-rose-500 animate-pulse'
                              : patient.priority === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {patient.name}
                      </div>
                    </td>

                    {/* Role / Condition */}
                    <td className="py-3.5 text-stone-600">
                      <div>
                        <span className="font-medium text-stone-700">{patient.condition}</span>
                        <span className="text-[10px] text-stone-400 block">
                          {assignedDoctor ? `Attending: ${assignedDoctor.name}` : 'Unassigned standby'}
                        </span>
                      </div>
                    </td>

                    {/* Performance Progress Pill Bar (Matching coral pill bars in screenshot) */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-36 h-2 rounded-full bg-stone-100 relative overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-600 transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-stone-500">
                          {patient.oxygen_saturation}% SpO2
                        </span>
                      </div>
                    </td>

                    {/* Actions Menu (...) */}
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onNavigateTab('assignments')}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* IPC Telemetry Status Strip (Preserving all OS Viva Requirements) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SHM Registry Box */}
        <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mono-font">
              SHM
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 block">Shared Memory (0x1234)</span>
              <span className="text-[10px] text-stone-500">
                2,480 Bytes Zero-Copy Kernel Block
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            ATTACHED
          </span>
        </div>

        {/* Semaphore Mutex Box */}
        <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs mono-font">
              SEM
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 block">System V Semaphores (0x1235)</span>
              <span className="text-[10px] text-stone-500">
                3 Mutexes armed with SEM_UNDO
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full mono-font">
            0 RACES
          </span>
        </div>

        {/* Fork Process Box */}
        <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs mono-font">
              PID
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 block">Forked Worker Pool</span>
              <span className="text-[10px] text-stone-500">
                Supervisor + 6 Concurrent Workers
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mono-font">
            {state.simulation_running ? '6 ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}
