'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Square,
  RotateCcw,
  Radio,
  Users,
  Briefcase,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { startSimulation, stopSimulation, pauseSimulation, resumeSimulation, resetSimulation } from '../lib/api';

interface HeaderProps {
  simulationRunning: boolean;
  simulationPaused: boolean;
  connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  lastUpdated: Date | null;
  onRefresh: () => void;
  title?: string;
  totalPatients?: number;
  totalDoctors?: number;
  totalQueue?: number;
}

export function Header({
  simulationRunning,
  simulationPaused,
  connectionStatus,
  lastUpdated,
  onRefresh,
  title = 'Dashboard',
  totalPatients = 12,
  totalDoctors = 6,
  totalQueue = 0,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoadingAction('start');
    try {
      await startSimulation();
      onRefresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async () => {
    setLoadingAction('stop');
    try {
      await stopSimulation();
      onRefresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTogglePause = async () => {
    setLoadingAction('pause');
    try {
      if (simulationPaused) {
        await resumeSimulation();
      } else {
        await pauseSimulation();
      }
      onRefresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset hospital baseline and recreate shared memory registry?')) {
      setLoadingAction('reset');
      try {
        await resetSimulation();
        onRefresh();
      } finally {
        setLoadingAction(null);
      }
    }
  };

  return (
    <header className="px-6 py-4 border-b border-white/60 bg-white/40 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Section Title & Quick Stat Pills (Matching Reference Image) */}
        <div className="flex flex-wrap items-center gap-5">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 metric-font">
            {title}
          </h1>

          {/* Stat Pills from Reference */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Pill 1 */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-stone-400 font-medium block">Total Patients</span>
                <span className="text-xs font-bold text-stone-900 metric-font">
                  {totalPatients.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-orange-100/90 text-orange-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-stone-400 font-medium block">Total Doctors</span>
                <span className="text-xs font-bold text-stone-900 metric-font">
                  {totalDoctors.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-stone-200/90 text-stone-700 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-stone-400 font-medium block">Emergency Queue</span>
                <span className="text-xs font-bold text-stone-900 metric-font">
                  {totalQueue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls + User Profile Pill (From Reference Image) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulation Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/90 shadow-xs text-xs">
            <Radio
              className={`h-3.5 w-3.5 ${
                connectionStatus === 'CONNECTED'
                  ? 'text-emerald-600 animate-pulse'
                  : connectionStatus === 'CONNECTING'
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            />
            <span className="text-[11px] font-medium text-stone-600">
              {connectionStatus === 'CONNECTED' ? 'Kernel Live' : 'Connecting...'}
            </span>
          </div>

          {/* Action Buttons */}
          {!simulationRunning ? (
            <button
              onClick={handleStart}
              disabled={loadingAction === 'start'}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition shadow-sm cursor-pointer disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start System
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTogglePause}
                disabled={loadingAction === 'pause'}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-700 border border-white/90 text-xs font-medium transition cursor-pointer shadow-xs disabled:opacity-40"
              >
                {simulationPaused ? (
                  <>
                    <Play className="h-3 w-3 fill-current text-amber-600" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 fill-current text-amber-600" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStop}
                disabled={loadingAction === 'stop'}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer disabled:opacity-40"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loadingAction === 'reset'}
            className="p-2 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-800 border border-white/90 transition cursor-pointer shadow-xs"
            title="Reset Simulation State"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Profile Pill (Direct match to reference image top-right: "Carla Sanford") */}
          <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-white/85 border border-white/90 shadow-xs cursor-pointer hover:bg-white transition">
            <img
              src="/images/doctors/doctor-ananya-rao.jpg"
              alt="Carla Sanford"
              className="w-7 h-7 rounded-full object-cover object-top border border-amber-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/doctors/doctor-arjun-mehta.jpg';
              }}
            />
            <span className="text-xs font-semibold text-stone-800 tracking-tight">
              Dr. Carla Sanford
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
