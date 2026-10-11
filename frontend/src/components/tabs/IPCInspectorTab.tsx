'use client';

import React from 'react';
import { Layers, Database, Lock, Mail, ShieldAlert, Cpu } from 'lucide-react';
import { SimulationState } from '../../lib/types';

interface IPCInspectorTabProps {
  state: SimulationState;
}

export function IPCInspectorTab({ state }: IPCInspectorTabProps) {
  const { metrics, simulation_running } = state;

  return (
    <div className="space-y-6">
      {/* IPC Primitives Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Shared Memory */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#F1F2F3] uppercase tracking-wider font-mono">
              System V Shared Memory
            </span>
            <Database className="h-4 w-4 text-[#F1F2F3]" />
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">IPC Key:</span>
              <span className="text-[#F1F2F3] font-bold">0x1234 (4660)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Segment Size:</span>
              <span className="text-[#F1F2F3] font-bold">sizeof(SharedRegistry) (~2.4 KB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Magic Signature:</span>
              <span className="text-[#D3D6DA] font-bold">0x4D454453 ("MEDS")</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Schema Version:</span>
              <span className="text-[#F1F2F3]">v1.0 (Fixed-Layout)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#858B92]">Lifecycle Ops:</span>
              <span className="text-[#B7BBC0]">shmget, shmat, shmdt, shmctl</span>
            </div>
          </div>
        </div>

        {/* 2. Semaphores */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#F1F2F3] uppercase tracking-wider font-mono">
              System V Semaphore Set
            </span>
            <Lock className="h-4 w-4 text-[#F1F2F3]" />
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">IPC Key:</span>
              <span className="text-[#F1F2F3] font-bold">0x1235 (4661)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Set Capacity:</span>
              <span className="text-[#F1F2F3] font-bold">3 Semaphores</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Recovery Flag:</span>
              <span className="text-[#D3D6DA] font-bold">SEM_UNDO Active</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Operations:</span>
              <span className="text-[#F1F2F3]">semop (P/V Atomic Ops)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#858B92]">Deadlock Policy:</span>
              <span className="text-[#B7BBC0]">Bounded Lock Window</span>
            </div>
          </div>
        </div>

        {/* 3. Message Queue */}
        <div className="p-5 rounded-2xl glass-panel-dark">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#F1F2F3] uppercase tracking-wider font-mono">
              System V Message Queue
            </span>
            <Mail className="h-4 w-4 text-[#F1F2F3]" />
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">IPC Key:</span>
              <span className="text-[#F1F2F3] font-bold">0x1236 (4662)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Queue Strategy:</span>
              <span className="text-[#F1F2F3] font-bold">Typed Channels (mtype)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Syscalls:</span>
              <span className="text-[#F1F2F3] font-bold">msgsnd, msgrcv, msgctl</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92]">Messages Handled:</span>
              <span className="text-[#F1F2F3] font-bold">{metrics.total_messages || metrics.total_assignments * 2}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#858B92]">Non-blocking:</span>
              <span className="text-[#B7BBC0]">IPC_NOWAIT Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Semaphore Details Table */}
      <div className="rounded-2xl glass-panel-dark p-5">
        <h3 className="text-sm font-bold text-[#F1F2F3] mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#F1F2F3]" />
          Semaphore Mutual Exclusion Sets
        </h3>
        <p className="text-xs text-[#858B92] mb-4">
          Each index in the semaphore set guards a strictly scoped critical section.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-2.5 px-4">Index</th>
                <th className="py-2.5 px-4">Identifier</th>
                <th className="py-2.5 px-4">Protected Resource</th>
                <th className="py-2.5 px-4">Scope & Critical Section Invariant</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono">
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">0</td>
                <td className="py-3 px-4 font-semibold text-[#F1F2F3]">SEM_REGISTRY_MUTEX</td>
                <td className="py-3 px-4 text-[#858B92]">SharedRegistry.patients[], doctors[]</td>
                <td className="py-3 px-4 text-[#B7BBC0]">
                  Protects patient vitals read-check-update & doctor claim transaction
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.15)] text-[10px]">
                    MUTEX ARMED (1)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">1</td>
                <td className="py-3 px-4 font-semibold text-[#F1F2F3]">SEM_EVENT_MUTEX</td>
                <td className="py-3 px-4 text-[#858B92]">Aggregate counters & Version counter</td>
                <td className="py-3 px-4 text-[#B7BBC0]">
                  Protects atomic sequence numbers and version counter increments
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.15)] text-[10px]">
                    MUTEX ARMED (1)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">2</td>
                <td className="py-3 px-4 font-semibold text-[#F1F2F3]">SEM_RACE_MUTEX</td>
                <td className="py-3 px-4 text-[#858B92]">Race Lab shared memory region</td>
                <td className="py-3 px-4 text-[#B7BBC0]">
                  Enforces mutual exclusion during Protected Mode race condition experiments
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.15)] text-[10px]">
                    LAB READY (1)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Queue Channels Table */}
      <div className="rounded-2xl glass-panel-dark p-5">
        <h3 className="text-sm font-bold text-[#F1F2F3] mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#F1F2F3]" />
          System V Message Queue Typed Channels
        </h3>
        <p className="text-xs text-[#858B92] mb-4">
          Direct process-to-process message passing using <code className="font-mono text-[#F1F2F3]">mtype</code> routing.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-2.5 px-4">Channel (mtype)</th>
                <th className="py-2.5 px-4">Message Constant</th>
                <th className="py-2.5 px-4">Sender Process</th>
                <th className="py-2.5 px-4">Target Process</th>
                <th className="py-2.5 px-4">Payload Content</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono">
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F05D69]">1</td>
                <td className="py-3 px-4 text-[#F1F2F3]">MSG_EMERGENCY_ALERT</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Patient Monitor</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Emergency Dispatcher</td>
                <td className="py-3 px-4 text-[#858B92]">Patient ID, priority, vitals breach description</td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">11 - 14</td>
                <td className="py-3 px-4 text-[#F1F2F3]">MSG_ASSIGNMENT_REQUEST</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Emergency Dispatcher</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Doctor Workers (1..4)</td>
                <td className="py-3 px-4 text-[#858B92]">Assigned patient ID, priority, procedure request</td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">3</td>
                <td className="py-3 px-4 text-[#F1F2F3]">MSG_ASSIGNMENT_ACK</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Doctor Worker</td>
                <td className="py-3 px-4 text-[#858B92]">Audit Logger</td>
                <td className="py-3 px-4 text-[#858B92]">Acknowledgment of claim, procedure underway</td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F1F2F3]">4</td>
                <td className="py-3 px-4 text-[#F1F2F3]">MSG_STATUS_UPDATE</td>
                <td className="py-3 px-4 text-[#B7BBC0]">Doctor Worker</td>
                <td className="py-3 px-4 text-[#858B92]">Supervisor / Logger</td>
                <td className="py-3 px-4 text-[#858B92]">Patient stabilized, treatment complete</td>
              </tr>
              <tr className="hover:bg-[rgba(211,214,218,0.06)] transition">
                <td className="py-3 px-4 font-bold text-[#F05D69]">99</td>
                <td className="py-3 px-4 text-[#F1F2F3]">MSG_SHUTDOWN</td>
                <td className="py-3 px-4 text-[#F05D69]">Main Controller</td>
                <td className="py-3 px-4 text-[#B7BBC0]">All Worker Processes</td>
                <td className="py-3 px-4 text-[#858B92]">Graceful teardown signal, unlink IPC resources</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
