'use client';

import React from 'react';
import { BookOpen, Layers, Lock, Database, Mail, Award, CheckCircle } from 'lucide-react';

export function DocumentationTab() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl glass-panel-dark">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-5 w-5 text-[#F1F2F3]" />
          <span className="text-xs uppercase font-bold tracking-wider text-[#F1F2F3] font-mono">
            Fourth-Year Operating Systems Project
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#F1F2F3]">
          MedSync — IPC-Based Smart Hospital Emergency Coordination System
        </h2>
        <p className="text-xs text-[#B7BBC0] mt-2 leading-relaxed">
          This system models high-throughput hospital emergency operations using multi-process concurrency, System V shared memory, semaphores, and message queues. It empirically demonstrates race conditions and their mathematical resolution via mutual exclusion.
        </p>
      </div>

      {/* IPC Mechanisms Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl glass-panel-dark">
          <Database className="h-5 w-5 text-[#F1F2F3] mb-2" />
          <h4 className="text-sm font-bold text-[#F1F2F3] mb-1">System V Shared Memory</h4>
          <p className="text-xs text-[#B7BBC0] leading-relaxed">
            Allocates a single fixed-layout memory segment mapped directly into the virtual address spaces of all worker processes. Zero-copy data sharing without kernel copy overhead.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel-dark">
          <Lock className="h-5 w-5 text-[#F1F2F3] mb-2" />
          <h4 className="text-sm font-bold text-[#F1F2F3] mb-1">System V Semaphores</h4>
          <p className="text-xs text-[#B7BBC0] leading-relaxed">
            Atomic counting semaphore sets using <code className="font-mono text-[#F1F2F3]">semop()</code>. Configured with <code className="font-mono text-[#D3D6DA]">SEM_UNDO</code> to ensure the OS kernel automatically releases locks if a worker abruptly crashes.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel-dark">
          <Mail className="h-5 w-5 text-[#F1F2F3] mb-2" />
          <h4 className="text-sm font-bold text-[#F1F2F3] mb-1">System V Message Queues</h4>
          <p className="text-xs text-[#B7BBC0] leading-relaxed">
            Kernel-managed FIFO queues with typed routing (<code className="font-mono text-[#F1F2F3]">mtype</code>). Guarantees ordered delivery and decoupling between the Patient Monitor and Doctor fleet.
          </p>
        </div>
      </div>

      {/* Viva Voce Quick Prep Card */}
      <div className="p-6 rounded-2xl glass-panel-dark">
        <h3 className="text-base font-bold text-[#F1F2F3] mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#F1F2F3]" />
          Key Viva Voce Questions & Answers
        </h3>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
            <span className="font-bold text-[#F1F2F3] block mb-1">
              Q1: What is a Race Condition, and how does Experiment 1 demonstrate it?
            </span>
            <p className="text-[#B7BBC0] leading-relaxed">
              A race condition occurs when system behavior depends on the non-deterministic interleaving of process execution. In Experiment 1, both Doctor #1 and Doctor #2 read the patient status as WAITING before either writes ASSIGNED. Without mutual exclusion, both conclude they claimed the patient, violating the single-claim invariant.
            </p>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
            <span className="font-bold text-[#F1F2F3] block mb-1">
              Q2: What is the purpose of SEM_UNDO in System V semaphores?
            </span>
            <p className="text-[#B7BBC0] leading-relaxed">
              When a process terminates abnormally while holding a semaphore lock, the operating system uses SEM_UNDO to revert the semaphore adjustment, preventing indefinite deadlocks for remaining workers.
            </p>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
            <span className="font-bold text-[#F1F2F3] block mb-1">
              Q3: Why can't we store std::string or raw pointers in shared memory?
            </span>
            <p className="text-[#B7BBC0] leading-relaxed">
              Dynamic containers like <code className="font-mono text-[#F1F2F3]">std::string</code> and pointers reference addresses within the local virtual address space of the allocating process. Other processes mapping the segment cannot resolve those external heap addresses. Fixed-size arrays ensure all data remains within the contiguous segment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
