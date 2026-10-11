'use client';

import React from 'react';
import { Cpu, Terminal, Shield, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import { SimulationState } from '../../lib/types';

interface ProcessMonitorTabProps {
  state: SimulationState;
  onRefresh: () => void;
}

export function ProcessMonitorTab({ state, onRefresh }: ProcessMonitorTabProps) {
  const { workers, simulation_running } = state;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Supervisor Subprocess</span>
          <div className="text-lg font-bold font-mono text-[#F1F2F3] my-1">
            {simulation_running ? 'medsync_sim' : 'INACTIVE'}
          </div>
          <p className="text-[11px] text-[#B7BBC0]">C++17 Standalone Compiled Engine</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Registered Workers</span>
          <div className="text-lg font-bold font-mono text-[#F1F2F3] my-1">
            {workers.length} Processes
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Independent OS worker routines</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">IPC Synchronization</span>
          <div className="text-lg font-bold font-mono text-[#F1F2F3] my-1">
            SEM_UNDO Protected
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Automated kernel recovery on crash</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel-dark">
          <span className="text-xs text-[#858B92]">Inter-Process Communication</span>
          <div className="text-lg font-bold font-mono text-[#F1F2F3] my-1">
            System V Queues
          </div>
          <p className="text-[11px] text-[#B7BBC0]">Typed message passing (msgget/msgsnd)</p>
        </div>
      </div>

      {/* Main Process Table */}
      <div className="rounded-2xl glass-panel-dark overflow-hidden">
        <div className="p-5 border-b border-[rgba(230,233,237,0.12)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F1F2F3] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#F1F2F3]" />
              Active Operating System Processes Registry
            </h3>
            <p className="text-xs text-[#858B92]">
              Direct read of shared memory workers registry (<code className="font-mono text-[#F1F2F3]">SharedRegistry.workers[]</code>)
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn text-[#F1F2F3] text-xs transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#B7BBC0]" />
            Refresh PIDs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">OS PID</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Messages Processed</th>
                <th className="py-3 px-4">Assignments</th>
                <th className="py-3 px-4">Lock Acquisitions</th>
                <th className="py-3 px-4">IPC Channels Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {workers.map((w) => {
                const isRunning = simulation_running && w.state === 1;

                return (
                  <tr key={w.role} className="hover:bg-[rgba(211,214,218,0.06)] transition">
                    {/* Role */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F1F2F3]">{w.name}</div>
                      <span className="text-[10px] text-[#858B92] font-mono">
                        Role ID #{w.role}
                      </span>
                    </td>

                    {/* PID */}
                    <td className="py-3 px-4 font-mono">
                      {w.pid ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] text-[#F1F2F3] font-bold">
                          {w.pid}
                        </span>
                      ) : (
                        <span className="text-[#858B92] italic">Not Forked</span>
                      )}
                    </td>

                    {/* State */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold font-mono flex items-center gap-1.5 w-max ${
                          isRunning
                            ? 'glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.24)]'
                            : 'bg-[#F05D69]/15 text-[#F05D69] border border-[#F05D69]/30'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-[#F1F2F3] animate-ping' : 'bg-[#F05D69]'}`} />
                        {isRunning ? 'RUNNING' : 'STOPPED'}
                      </span>
                    </td>

                    {/* Messages */}
                    <td className="py-3 px-4 font-mono text-[#B7BBC0]">
                      Sent: <span className="text-[#F1F2F3]">{w.messages_sent}</span> | Recv:{' '}
                      <span className="text-[#D3D6DA]">{w.messages_received}</span>
                    </td>

                    {/* Assignments */}
                    <td className="py-3 px-4 font-mono text-[#B7BBC0]">
                      <span className="text-[#F1F2F3] font-semibold">{w.assignments_successful}</span> successful
                    </td>

                    {/* Lock Acquisitions */}
                    <td className="py-3 px-4 font-mono text-[#D3D6DA]">
                      {w.lock_acquisitions} sem_wait
                    </td>

                    {/* IPC Channels */}
                    <td className="py-3 px-4 text-[11px] text-[#858B92] font-mono">
                      {w.role === 1 && 'shmget, semget, msgget (Supervisor)'}
                      {w.role === 2 && 'shmat, semop, msgsnd (Vitals Alert)'}
                      {w.role === 3 && 'msgrcv, semop, msgsnd (Triage Router)'}
                      {w.role >= 4 && w.role <= 6 && 'msgrcv(channel), semop, shmat (Treatment)'}
                      {w.role === 7 && 'msgrcv, audit stream (Disk Log)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
