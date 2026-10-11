'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  ShieldCheck,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { RaceExperimentResult } from '../../lib/types';
import { runRaceExperiment } from '../../lib/api';

interface RaceConditionLabTabProps {
  onRefresh: () => void;
}

export function RaceConditionLabTab({ onRefresh }: RaceConditionLabTabProps) {
  const [selectedExperiment, setSelectedExperiment] = useState<1 | 2 | 3>(1);
  const [unsafeResult, setUnsafeResult] = useState<RaceExperimentResult | null>(null);
  const [protectedResult, setProtectedResult] = useState<RaceExperimentResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [counterCount, setCounterCount] = useState<number>(10000);

  const handleRunUnsafe = async () => {
    setIsRunning(true);
    try {
      const res = await runRaceExperiment(selectedExperiment, 'unsafe', counterCount);
      if (res.status === 'SUCCESS') {
        setUnsafeResult(res.result);
      } else {
        alert('Experiment error: ' + res.message);
      }
      onRefresh();
    } catch (e) {
      alert('Failed: ' + e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunProtected = async () => {
    setIsRunning(true);
    try {
      const res = await runRaceExperiment(selectedExperiment, 'protected', counterCount);
      if (res.status === 'SUCCESS') {
        setProtectedResult(res.result);
      } else {
        alert('Experiment error: ' + res.message);
      }
      onRefresh();
    } catch (e) {
      alert('Failed: ' + e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunBoth = async () => {
    setIsRunning(true);
    try {
      const resU = await runRaceExperiment(selectedExperiment, 'unsafe', counterCount);
      if (resU.status === 'SUCCESS') setUnsafeResult(resU.result);

      const resP = await runRaceExperiment(selectedExperiment, 'protected', counterCount);
      if (resP.status === 'SUCCESS') setProtectedResult(resP.result);

      onRefresh();
    } catch (e) {
      alert('Failed: ' + e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setUnsafeResult(null);
    setProtectedResult(null);
  };

  const handleExportJSON = () => {
    const data = {
      experiment_type: selectedExperiment,
      timestamp: new Date().toISOString(),
      unsafe_mode_result: unsafeResult,
      protected_mode_result: protectedResult,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medsync_race_experiment_${selectedExperiment}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-dark flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.2)] font-mono">
              SIGNATURE LAB
            </span>
            <span className="text-xs text-[#858B92] font-mono">Operating Systems Synchronization Laboratory</span>
          </div>
          <h2 className="text-xl font-bold text-[#F1F2F3] tracking-wide">
            Concurrency & Race Condition Lab
          </h2>
          <p className="text-xs text-[#B7BBC0] mt-1 max-w-2xl leading-relaxed">
            Execute actual compiled C++ multi-process concurrency experiments comparing broken synchronization (Unsafe Mode) against System V semaphore critical sections (Protected Mode).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunBoth}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel-light hover:bg-[rgba(237,239,242,0.25)] text-[#F1F2F3] font-bold text-xs tracking-wider transition border border-[rgba(255,255,255,0.3)] cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current text-[#F1F2F3]" />
            {isRunning ? 'EXECUTING C++...' : 'RUN BOTH & COMPARE'}
          </button>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="p-2.5 rounded-xl glass-btn text-[#858B92] hover:text-[#F1F2F3] transition cursor-pointer"
            title="Reset experiment results"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!unsafeResult && !protectedResult}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl glass-btn text-[#F1F2F3] text-xs font-medium transition cursor-pointer disabled:opacity-40"
            title="Export results as JSON"
          >
            <Download className="h-4 w-4 text-[#B7BBC0]" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Experiment Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => { setSelectedExperiment(1); handleReset(); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            selectedExperiment === 1
              ? 'glass-panel-light-highlight border-[rgba(255,255,255,0.35)] shadow-md'
              : 'glass-panel-dark text-[#858B92] hover:border-[rgba(255,255,255,0.22)]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#F1F2F3] font-bold block mb-1">EXPERIMENT 1</span>
          <div className="text-sm font-bold text-[#F1F2F3] mb-1">Duplicate Patient Assignment</div>
          <p className="text-[11px] text-[#B7BBC0] leading-relaxed">
            TOCTOU (Time-of-Check to Time-of-Use) race: Two doctor processes simultaneously claim Patient #1.
          </p>
        </button>

        <button
          onClick={() => { setSelectedExperiment(2); handleReset(); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            selectedExperiment === 2
              ? 'glass-panel-light-highlight border-[rgba(255,255,255,0.35)] shadow-md'
              : 'glass-panel-dark text-[#858B92] hover:border-[rgba(255,255,255,0.22)]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#F1F2F3] font-bold block mb-1">EXPERIMENT 2</span>
          <div className="text-sm font-bold text-[#F1F2F3] mb-1">Lost-Update Counter</div>
          <p className="text-[11px] text-[#B7BBC0] leading-relaxed">
            Two workers concurrently increment a shared variable 10,000 times (target: 20,000 increments).
          </p>
        </button>

        <button
          onClick={() => { setSelectedExperiment(3); handleReset(); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            selectedExperiment === 3
              ? 'glass-panel-light-highlight border-[rgba(255,255,255,0.35)] shadow-md'
              : 'glass-panel-dark text-[#858B92] hover:border-[rgba(255,255,255,0.22)]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#F1F2F3] font-bold block mb-1">EXPERIMENT 3</span>
          <div className="text-sm font-bold text-[#F1F2F3] mb-1">Conflicting Status Transitions</div>
          <p className="text-[11px] text-[#B7BBC0] leading-relaxed">
            Workers attempt incompatible state transitions (ASSIGNED -&gt; COMPLETED vs IN_TREATMENT).
          </p>
        </button>
      </div>

      {/* Split-Screen Arena: BOTH PANELS SHARE IDENTICAL NEUTRAL GREY GLASS STYLING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: UNSAFE MODE (Neutral Grey Glass Panel with small red indicator) */}
        <div className="p-6 rounded-2xl glass-panel-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#F05D69]" />
                <h3 className="text-base font-bold text-[#F1F2F3] tracking-wide">
                  UNSAFE MODE <span className="text-xs text-[#F05D69] font-normal">(Broken Sync)</span>
                </h3>
              </div>
              <button
                onClick={handleRunUnsafe}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-xl bg-[#F05D69] hover:bg-[#F05D69]/90 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                RUN UNSAFE
              </button>
            </div>

            {/* Invariant Status Badge */}
            <div className="my-4">
              {unsafeResult ? (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    unsafeResult.invariant_violated
                      ? 'bg-[#F05D69]/10 border-[#F05D69]/35 text-[#F05D69]'
                      : 'bg-[#E9AE58]/10 border-[#E9AE58]/35 text-[#E9AE58]'
                  }`}
                >
                  {unsafeResult.invariant_violated ? (
                    <XCircle className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase font-mono">
                      {unsafeResult.invariant_violated
                        ? 'CRITICAL INVARIANT VIOLATED'
                        : 'INVARIANT PRESERVED (RACE WINDOW MISSED)'}
                    </div>
                    <p className="text-[11px] text-[#F1F2F3] mt-0.5">{unsafeResult.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl glass-panel-light border border-dashed border-[rgba(255,255,255,0.12)] text-center text-xs text-[#858B92]">
                  Click "RUN UNSAFE" or "RUN BOTH" to execute C++ process without semaphores.
                </div>
              )}
            </div>

            {/* Detailed Metrics */}
            {unsafeResult && (
              <div className="space-y-3 font-mono text-xs">
                {selectedExperiment === 1 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Doctor #1 Claim:</span>
                      <span className={unsafeResult.worker1_claimed ? 'text-[#F05D69] font-bold' : 'text-[#858B92]'}>
                        {unsafeResult.worker1_claimed ? 'CLAIMED PATIENT' : 'REJECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Doctor #2 Claim:</span>
                      <span className={unsafeResult.worker2_claimed ? 'text-[#F05D69] font-bold' : 'text-[#858B92]'}>
                        {unsafeResult.worker2_claimed ? 'CLAIMED PATIENT' : 'REJECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                      <span className="text-[#858B92]">Final Assignment State:</span>
                      <span className="text-[#F05D69] font-bold">DOUBLE CLAIM (CORRUPTED)</span>
                    </div>
                  </div>
                )}

                {selectedExperiment === 2 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Expected Count:</span>
                      <span className="text-[#F1F2F3] font-bold">{unsafeResult.target_counter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Actual Shared Count:</span>
                      <span className="text-[#F05D69] font-bold text-sm">{unsafeResult.actual_counter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Lost Increments:</span>
                      <span className="text-[#F05D69] font-bold">{unsafeResult.lost_updates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Data Loss Ratio:</span>
                      <span className="text-[#F05D69]">
                        {((unsafeResult.lost_updates / unsafeResult.target_counter) * 100).toFixed(1)}% Lost
                      </span>
                    </div>
                  </div>
                )}

                {selectedExperiment === 3 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Worker 1 Action:</span>
                      <span className="text-[#F1F2F3]">ASSIGNED -&gt; COMPLETED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Worker 2 Action:</span>
                      <span className="text-[#F1F2F3]">ASSIGNED -&gt; IN_TREATMENT</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                      <span className="text-[#858B92]">Result:</span>
                      <span className="text-[#F05D69] font-bold">STATE OVERWRITE WITHOUT VALIDATION</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl glass-panel-light text-[#858B92]">
                    Duration: <span className="text-[#F1F2F3] font-semibold">{unsafeResult.duration_ms.toFixed(2)} ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl glass-panel-light text-[#858B92]">
                    Worker PID: <span className="text-[#F1F2F3] font-semibold">{unsafeResult.worker1_pid}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.08)] text-[11px] text-[#858B92]">
            <span className="font-semibold text-[#F05D69]">Pedagogical Mechanism:</span> Reads state into local register without acquiring lock; memory writes interleave unpredictably.
          </div>
        </div>

        {/* Right: PROTECTED MODE (Same Neutral Grey Glass Panel with small teal/silver indicator) */}
        <div className="p-6 rounded-2xl glass-panel-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#D3D6DA]" />
                <h3 className="text-base font-bold text-[#F1F2F3] tracking-wide">
                  PROTECTED MODE <span className="text-xs text-[#B7BBC0] font-normal">(System V Semaphore)</span>
                </h3>
              </div>
              <button
                onClick={handleRunProtected}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-xl glass-panel-light hover:bg-[rgba(237,239,242,0.25)] text-[#F1F2F3] text-xs font-bold transition border border-[rgba(255,255,255,0.25)] cursor-pointer disabled:opacity-50"
              >
                RUN PROTECTED
              </button>
            </div>

            {/* Invariant Status Badge */}
            <div className="my-4">
              {protectedResult ? (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    !protectedResult.invariant_violated
                      ? 'glass-panel-light text-[#F1F2F3] border-[rgba(255,255,255,0.3)]'
                      : 'bg-[#F05D69]/10 border-[#F05D69]/35 text-[#F05D69]'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#F1F2F3]" />
                  <div>
                    <div className="text-xs font-bold uppercase font-mono text-[#F1F2F3]">
                      INVARIANT STRICTLY PRESERVED
                    </div>
                    <p className="text-[11px] text-[#B7BBC0] mt-0.5">{protectedResult.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl glass-panel-light border border-dashed border-[rgba(255,255,255,0.12)] text-center text-xs text-[#858B92]">
                  Click "RUN PROTECTED" or "RUN BOTH" to execute with System V semaphores.
                </div>
              )}
            </div>

            {/* Detailed Metrics */}
            {protectedResult && (
              <div className="space-y-3 font-mono text-xs">
                {selectedExperiment === 1 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Doctor Claim #1:</span>
                      <span className="text-[#F1F2F3] font-bold">1 SUCCESSFUL CLAIM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Doctor Claim #2:</span>
                      <span className="text-[#E9AE58] font-bold">REJECTED (CONFLICT PREVENTED)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                      <span className="text-[#858B92]">Final Assignment State:</span>
                      <span className="text-[#F1F2F3] font-bold">EXACTLY 1 OWNER (SAFE)</span>
                    </div>
                  </div>
                )}

                {selectedExperiment === 2 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Expected Count:</span>
                      <span className="text-[#F1F2F3] font-bold">{protectedResult.target_counter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Actual Shared Count:</span>
                      <span className="text-[#F1F2F3] font-bold text-sm">{protectedResult.actual_counter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Lost Increments:</span>
                      <span className="text-[#F1F2F3] font-bold">0 (ZERO LOSS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Synchronization Accuracy:</span>
                      <span className="text-[#F1F2F3] font-bold">100.0% Exact Match</span>
                    </div>
                  </div>
                )}

                {selectedExperiment === 3 && (
                  <div className="p-3.5 rounded-xl glass-panel-light space-y-1.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Worker 1 Action:</span>
                      <span className="text-[#F1F2F3]">ASSIGNED -&gt; IN_TREATMENT (ACCEPTED)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858B92]">Worker 2 Action:</span>
                      <span className="text-[#E9AE58]">ASSIGNED -&gt; COMPLETED (REJECTED)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                      <span className="text-[#858B92]">Result:</span>
                      <span className="text-[#F1F2F3] font-bold">STATE MACHINE INTEGRITY PRESERVED</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl glass-panel-light text-[#858B92]">
                    Duration: <span className="text-[#F1F2F3] font-semibold">{protectedResult.duration_ms.toFixed(2)} ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl glass-panel-light text-[#858B92]">
                    Worker PID: <span className="text-[#F1F2F3] font-semibold">{protectedResult.worker1_pid}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.08)] text-[11px] text-[#858B92]">
            <span className="font-semibold text-[#F1F2F3]">Pedagogical Mechanism:</span> Encloses complete read-check-write transaction inside <code className="font-mono text-[#F1F2F3]">SEM_REGISTRY_MUTEX</code> critical section using <code className="font-mono text-[#F1F2F3]">semop()</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
