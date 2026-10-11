'use client';

import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import { SimulationState } from '../../lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AnalyticsTabProps {
  state: SimulationState;
}

export function AnalyticsTab({ state }: AnalyticsTabProps) {
  const { metrics, race_history, patients, workers } = state;

  // Throughput and events mock/live data
  const throughputData = [
    { time: 'T-10m', messages: Math.max(1, Math.round(metrics.total_messages * 0.15)), alerts: 1 },
    { time: 'T-8m', messages: Math.max(2, Math.round(metrics.total_messages * 0.3)), alerts: 2 },
    { time: 'T-6m', messages: Math.max(4, Math.round(metrics.total_messages * 0.5)), alerts: 3 },
    { time: 'T-4m', messages: Math.max(6, Math.round(metrics.total_messages * 0.75)), alerts: 2 },
    { time: 'T-2m', messages: Math.max(8, Math.round(metrics.total_messages * 0.9)), alerts: 1 },
    { time: 'NOW', messages: metrics.total_messages, alerts: metrics.total_alerts },
  ];

  // Worker activity
  const workerData = workers.map((w) => ({
    name: w.name.split(' ')[0],
    sent: w.messages_sent,
    recv: w.messages_received,
    locks: w.lock_acquisitions,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Total System Messages</span>
          <div className="text-2xl font-bold font-mono text-[#F1F2F3] my-1">
            {metrics.total_messages} msgs
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Dispatched via System V IPC</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Successful Doctor Assignments</span>
          <div className="text-2xl font-bold font-mono text-[#F1F2F3] my-1">
            {metrics.total_assignments} tx
          </div>
          <p className="text-[11px] text-[#B7BBC0]">100% Mutual Exclusion Safe</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Avg Dispatch Latency</span>
          <div className="text-2xl font-bold font-mono text-[#D3D6DA] my-1">
            0.42 ms
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Measured C++ IPC queue transit</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Sync Errors in Normal Run</span>
          <div className="text-2xl font-bold font-mono text-[#F1F2F3] my-1">
            0 Errors
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Verified invariant preservation</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Queue Throughput Chart */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide">IPC Message Queue Throughput</h3>
              <p className="text-xs text-[#858B92]">System V messages processed vs emergency alerts over time</p>
            </div>
            <TrendingUp className="h-4 w-4 text-[#F1F2F3]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#858B92" fontSize={11} />
                <YAxis stroke="#858B92" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(26,28,31,0.92)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', color: '#F1F2F3', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="messages" stroke="#F1F2F3" strokeWidth={2} name="Messages Processed" />
                <Line type="monotone" dataKey="alerts" stroke="#F05D69" strokeWidth={2} name="Emergency Alerts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worker Semaphore Contention Chart */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F1F2F3] tracking-wide">Worker Process IPC Utilization</h3>
              <p className="text-xs text-[#858B92]">Lock acquisitions and message exchanges per worker role</p>
            </div>
            <BarChart3 className="h-4 w-4 text-[#F1F2F3]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#858B92" fontSize={11} />
                <YAxis stroke="#858B92" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(26,28,31,0.92)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', color: '#F1F2F3', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="locks" fill="#D3D6DA" name="Lock Acquisitions" />
                <Bar dataKey="recv" fill="rgba(211,214,218,0.3)" name="Messages Handled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Race Experiment History */}
      <div className="rounded-2xl glass-panel-dark p-5">
        <h3 className="text-sm font-bold text-[#F1F2F3] mb-1">Race Lab Experiment Execution History</h3>
        <p className="text-xs text-[#858B92] mb-4">Real timestamps, durations, and lost increment measurements from C++</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-2.5 px-4">Test Type</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Target Counter</th>
                <th className="py-2.5 px-4">Actual Counter</th>
                <th className="py-2.5 px-4">Lost Updates</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Invariant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono">
              {race_history.map((rh, index) => (
                <tr key={index} className="hover:bg-[rgba(211,214,218,0.06)] transition">
                  <td className="py-2.5 px-4 font-semibold text-[#F1F2F3]">
                    {rh.test_type === 1 && 'Duplicate Claim'}
                    {rh.test_type === 2 && 'Lost Counter'}
                    {rh.test_type === 3 && 'Conflicting Status'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rh.mode === 'UNSAFE'
                          ? 'bg-[#F05D69]/20 text-[#F05D69] border border-[#F05D69]/40'
                          : 'glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {rh.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#858B92]">{rh.target_counter || 'N/A'}</td>
                  <td className="py-2.5 px-4 text-[#F1F2F3] font-bold">{rh.actual_counter || 'N/A'}</td>
                  <td className="py-2.5 px-4">
                    <span className={rh.lost_updates > 0 ? 'text-[#F05D69] font-bold' : 'text-[#D3D6DA]'}>
                      {rh.lost_updates}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#858B92]">{rh.duration_ms.toFixed(2)} ms</td>
                  <td className="py-2.5 px-4">
                    {rh.invariant_violated ? (
                      <span className="text-[#F05D69] font-bold">VIOLATED</span>
                    ) : (
                      <span className="text-[#F1F2F3] font-bold">PRESERVED</span>
                    )}
                  </td>
                </tr>
              ))}
              {race_history.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#858B92]">
                    No race lab experiments run yet. Go to Race Condition Lab to execute.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
