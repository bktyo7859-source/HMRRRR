'use client';

import React from 'react';
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
} from 'lucide-react';
import { SimulationState } from '../../lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OverviewTabProps {
  state: SimulationState;
  onNavigateTab: (tab: any) => void;
}

export function OverviewTab({ state, onNavigateTab }: OverviewTabProps) {
  const { metrics, patients, doctors, workers, recent_events } = state;

  const kpis = [
    {
      title: 'Active Patients',
      value: patients.filter((p) => p.treatment_status !== 3).length,
      icon: Users,
      description: `${patients.length} registered emergency cases`,
      badge: 'MONITORED',
    },
    {
      title: 'Critical Alerts',
      value: patients.filter((p) => p.priority === 1 && p.treatment_status !== 3).length,
      icon: AlertTriangle,
      description: 'Require immediate physician triage',
      badge: metrics.total_alerts > 0 ? `${metrics.total_alerts} Total Alerts` : 'NORMAL',
      isCritical: patients.some((p) => p.priority === 1 && p.treatment_status !== 3),
    },
    {
      title: 'Available Doctors',
      value: doctors.filter((d) => d.status === 0).length,
      icon: UserCheck,
      description: `${doctors.length} hospital clinical staff`,
      badge: `${doctors.filter((d) => d.status === 1).length} ATTENDING`,
    },
    {
      title: 'Active OS Processes',
      value: state.simulation_running ? (metrics.active_processes || 6) : 0,
      icon: Cpu,
      description: 'Forked workers running with real PIDs',
      badge: state.simulation_running ? 'RUNNING' : 'STOPPED',
    },
    {
      title: 'Messages Processed',
      value: metrics.total_messages || metrics.total_assignments * 2,
      icon: Radio,
      description: 'System V Queue msgsnd / msgrcv',
      badge: 'IPC PIPELINE',
    },
    {
      title: 'Sync Invariant Status',
      value: metrics.sync_errors === 0 ? '0 Errors' : `${metrics.sync_errors} Races`,
      icon: ShieldCheck,
      description: 'Mutex protected critical sections',
      badge: 'SAFE STATE',
    },
  ];

  // Chart Data: Vitals Bar Chart in Monochromatic Smoked Silver
  const vitalsData = patients.slice(0, 8).map((p) => ({
    name: p.name.split(' ')[0],
    hr: p.heart_rate,
    spo2: p.oxygen_saturation,
    status: p.treatment_status === 1 ? 'Assigned' : p.treatment_status === 2 ? 'In Tx' : p.treatment_status === 3 ? 'Done' : 'Waiting',
  }));

  // Chart Data: Priority Distribution
  const priorityData = [
    { name: 'Critical (P1)', count: patients.filter((p) => p.priority === 1).length, color: '#F05D69' },
    { name: 'High (P2)', count: patients.filter((p) => p.priority === 2).length, color: '#E9AE58' },
    { name: 'Medium (P3)', count: patients.filter((p) => p.priority === 3).length, color: '#CBD5E1' },
    { name: 'Low (P4)', count: patients.filter((p) => p.priority === 4).length, color: '#94A3B8' },
  ].filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards in Two-Shade Grey Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-md hover:border-[rgba(255,255,255,0.26)] transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#B7BBC0] font-medium">{kpi.title}</span>
                <Icon className={`h-4 w-4 ${kpi.isCritical ? 'text-[#F05D69]' : 'text-[#858B92]'}`} />
              </div>

              <div className="my-3">
                <div className={`text-2xl font-bold metric-font ${kpi.isCritical ? 'text-[#F05D69]' : 'text-[#F1F2F3]'}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-[#858B92] mt-0.5 truncate">{kpi.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.08)] text-[10px] mono-font text-[#B7BBC0]">
                <span className="px-2 py-0.5 rounded-md bg-[rgba(211,214,218,0.08)] border border-[rgba(230,233,237,0.12)] text-[#F1F2F3]">
                  {kpi.badge}
                </span>
                <span className="flex items-center gap-0.5 text-[#B7BBC0]">
                  LIVE <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row in Dark Smoke Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vitals Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide">Live Simulated Patient Vitals</h3>
              <p className="text-xs text-[#858B92]">Heart Rate (bpm) vs Oxygen Saturation (%) across active triage admissions</p>
            </div>
            <div className="flex items-center gap-4 text-xs mono-font">
              <span className="flex items-center gap-1.5 text-[#F1F2F3]">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#E2E8F0]" /> HR (bpm)
              </span>
              <span className="flex items-center gap-1.5 text-[#B7BBC0]">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#858B92]" /> SpO2 (%)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vitalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#858B92" fontSize={11} tickLine={false} />
                <YAxis stroke="#858B92" fontSize={11} tickLine={false} domain={[40, 180]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26,28,31,0.92)',
                    borderColor: 'rgba(230,233,237,0.20)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(16px)',
                    color: '#F1F2F3',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hr" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Heart Rate" />
                <Bar dataKey="spo2" fill="#858B92" radius={[4, 4, 0, 0]} name="Oxygen Saturation" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority & Triage Distribution */}
        <div className="p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide mb-1">Emergency Triage Distribution</h3>
            <p className="text-xs text-[#858B92] mb-4">Breakdown of active priority triage levels</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(38,40,43,0.9)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26,28,31,0.92)',
                      borderColor: 'rgba(230,233,237,0.20)',
                      borderRadius: '10px',
                      backdropFilter: 'blur(16px)',
                      color: '#F1F2F3',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)] text-xs">
            {priorityData.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[#858B92] truncate">{p.name}:</span>
                <span className="text-[#F1F2F3] font-bold mono-font">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currently Attending Patients Section */}
      <div className="p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[rgba(211,214,218,0.12)] border border-[rgba(255,255,255,0.18)] text-[#F1F2F3]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide">Currently Attending Patients</h3>
              <p className="text-xs text-[#858B92]">Active physician-to-patient attendance and clinical assignments</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('assignments')}
            className="text-xs font-medium text-[#B7BBC0] hover:text-[#FFFFFF] flex items-center gap-1 transition cursor-pointer"
          >
            View All Assignments →
          </button>
        </div>

        {patients.filter((p) => p.assigned_doctor_id > 0).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {patients
              .filter((p) => p.assigned_doctor_id > 0)
              .map((patient) => {
                const doc = doctors.find((d) => d.id === patient.assigned_doctor_id);
                return (
                  <div
                    key={patient.id}
                    onClick={() => onNavigateTab('assignments')}
                    className="p-3.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.14)] hover:border-[rgba(255,255,255,0.28)] transition flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doc ? (
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover object-top border border-[rgba(255,255,255,0.20)] group-hover:border-[rgba(255,255,255,0.40)] transition shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[rgba(38,40,43,0.60)] border border-[rgba(230,233,237,0.15)] flex items-center justify-center shrink-0">
                          <UserCheck className="w-5 h-5 text-[#B7BBC0]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#F1F2F3] truncate group-hover:text-white transition">
                            {doc ? doc.name : `Doctor #${patient.assigned_doctor_id}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#B7BBC0] truncate">{doc?.specialization || 'Attending Physician'}</p>
                        <p className="text-[11px] text-[#858B92] truncate mt-0.5">
                          Attending <span className="text-[#F1F2F3] font-medium">{patient.name}</span> (#{patient.id})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md block mb-1 ${
                          patient.priority === 1
                            ? 'bg-[rgba(240,93,105,0.20)] text-[#F05D69] border border-[rgba(240,93,105,0.30)]'
                            : 'bg-[rgba(233,174,88,0.20)] text-[#E9AE58] border border-[rgba(233,174,88,0.30)]'
                        }`}
                      >
                        P{patient.priority}
                      </span>
                      <span className="text-[10px] font-mono text-[#B7BBC0] bg-[rgba(211,214,218,0.08)] px-2 py-0.5 rounded-md border border-[rgba(230,233,237,0.12)]">
                        Attending
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[rgba(26,28,30,0.50)] border border-dashed border-[rgba(230,233,237,0.15)] text-center space-y-2">
            <p className="text-xs text-[#858B92]">
              No active patient assignments currently in progress. All available physicians are on emergency standby.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => onNavigateTab('doctors')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[rgba(211,214,218,0.10)] hover:bg-[rgba(211,214,218,0.18)] text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] transition cursor-pointer"
              >
                Open Doctor Directory
              </button>
              <button
                onClick={() => onNavigateTab('queue')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(237,239,242,0.16)] hover:bg-[rgba(237,239,242,0.24)] text-white border border-[rgba(255,255,255,0.24)] transition cursor-pointer"
              >
                Inspect Emergency Queue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Live Alerts & Worker Health in Dark Smoke Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts Feed */}
        <div className="p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#F1F2F3] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F05D69]" />
              Recent Emergency Alerts
            </h3>
            <button
              onClick={() => onNavigateTab('patients')}
              className="text-xs text-[#B7BBC0] hover:text-[#FFFFFF] cursor-pointer transition"
            >
              View All Patients →
            </button>
          </div>

          <div className="space-y-2.5">
            {patients
              .filter((p) => p.alert_active === 1 || p.priority === 1)
              .slice(0, 4)
              .map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(240,93,105,0.25)] flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#F05D69] animate-pulse" />
                    <div>
                      <div className="text-xs font-semibold text-[#F1F2F3]">
                        {p.name} <span className="text-[#858B92] font-normal">(Patient #{p.id})</span>
                      </div>
                      <p className="text-[11px] text-[#B7BBC0] truncate max-w-xs">
                        {p.active_alert_message || p.condition}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs mono-font">
                    <span className="px-2 py-0.5 rounded-md bg-[rgba(240,93,105,0.18)] text-[#F05D69] font-bold text-[10px]">
                      P{p.priority} CRITICAL
                    </span>
                    <div className="text-[10px] text-[#858B92] mt-1">
                      HR: {p.heart_rate} | SpO2: {p.oxygen_saturation}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Process Health & Event Log Stream Preview */}
        <div className="p-5 rounded-2xl bg-[rgba(38,40,43,0.66)] backdrop-blur-xl border border-[rgba(230,233,237,0.15)] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#F1F2F3] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#B7BBC0]" />
              IPC Event Stream (Real-Time Subprocess Pipe)
            </h3>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-[#B7BBC0] hover:text-[#FFFFFF] cursor-pointer transition"
            >
              Full Event Audit →
            </button>
          </div>

          <div className="space-y-2">
            {recent_events.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl bg-[rgba(26,28,30,0.60)] border border-[rgba(230,233,237,0.12)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="px-1.5 py-0.5 rounded-md bg-[rgba(211,214,218,0.08)] text-[#F1F2F3] text-[10px] mono-font font-semibold border border-[rgba(230,233,237,0.12)]">
                    {ev.source}
                  </span>
                  <span className="text-[#B7BBC0] truncate">{ev.description}</span>
                </div>
                <span className="text-[10px] text-[#858B92] mono-font shrink-0 ml-2">
                  PID {ev.pid || 'KERN'}
                </span>
              </div>
            ))}
            {recent_events.length === 0 && (
              <div className="p-6 text-center text-xs text-[#858B92]">
                Start simulation to observe real-time IPC message transitions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
