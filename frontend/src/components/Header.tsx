'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, Square, RotateCcw, Radio, ShieldCheck } from 'lucide-react';
import { startSimulation, stopSimulation, pauseSimulation, resumeSimulation, resetSimulation } from '../lib/api';

interface HeaderProps {
  simulationRunning: boolean;
  simulationPaused: boolean;
  connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export function Header({
  simulationRunning,
  simulationPaused,
  connectionStatus,
  lastUpdated,
  onRefresh,
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
    <header className="sticky top-0 z-30 px-6 py-3 bg-[rgba(38,40,43,0.72)] backdrop-blur-xl border-b border-[rgba(230,233,237,0.15)] shadow-lg shadow-black/30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand & Simulation Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[rgba(211,214,218,0.12)] border border-[rgba(255,255,255,0.22)] flex items-center justify-center text-[#F1F2F3] shadow-inner">
              <Activity className="h-5 w-5 text-[#F1F2F3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-lg text-[#F1F2F3] metric-font">
                  MED<span className="text-[#FFFFFF] underline decoration-[rgba(255,255,255,0.35)] underline-offset-4">SYNC</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-[rgba(211,214,218,0.08)] border border-[rgba(230,233,237,0.15)] text-[#B7BBC0] mono-font">
                  IPC KERNEL v4.2
                </span>
              </div>
              <p className="text-xs text-[#858B92]">Inter-Process Hospital Operations Center</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[rgba(255,255,255,0.10)]">
            {/* Status Pill in Translucent Smoked Glass */}
            {simulationRunning ? (
              simulationPaused ? (
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium tracking-wider mono-font flex items-center gap-1.5 bg-[rgba(233,174,88,0.15)] text-[#E9AE58] border border-[rgba(233,174,88,0.30)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E9AE58]" />
                  CLOCK PAUSED
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium tracking-wider mono-font flex items-center gap-1.5 bg-[rgba(211,214,218,0.14)] text-[#F1F2F3] border border-[rgba(255,255,255,0.25)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#68D391] animate-pulse" />
                  IPC RUNNING
                </span>
              )
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium tracking-wider mono-font flex items-center gap-1.5 bg-[rgba(240,93,105,0.12)] text-[#F05D69] border border-[rgba(240,93,105,0.28)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F05D69]" />
                STOPPED
              </span>
            )}

            {/* Academic Notice Badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#B7BBC0] bg-[rgba(211,214,218,0.08)] px-2.5 py-1 rounded-lg border border-[rgba(230,233,237,0.12)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#B7BBC0]" />
              <span>OS Systems Lab Mode</span>
            </div>
          </div>
        </div>

        {/* Center: Live Clock & WebSocket Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(211,214,218,0.08)] border border-[rgba(230,233,237,0.15)] text-[#B7BBC0] mono-font shadow-inner">
            <span className="text-[10px] text-[#858B92]">CLOCK</span>
            <span className="text-[#F1F2F3] font-semibold text-xs tracking-wider">{currentTime || '--:--:--'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(211,214,218,0.08)] border border-[rgba(230,233,237,0.15)] shadow-inner">
            <Radio
              className={`h-3.5 w-3.5 ${
                connectionStatus === 'CONNECTED'
                  ? 'text-[#68D391] animate-pulse'
                  : connectionStatus === 'CONNECTING'
                  ? 'text-[#E9AE58]'
                  : 'text-[#F05D69]'
              }`}
            />
            <span className="text-[11px] mono-font text-[#B7BBC0]">
              {connectionStatus === 'CONNECTED'
                ? 'BRIDGE LIVE'
                : connectionStatus === 'CONNECTING'
                ? 'SYNCING...'
                : 'OFFLINE'}
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-[#858B92] hidden xl:inline">
                ({lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </div>
        </div>

        {/* Right: Simulation Controls */}
        <div className="flex items-center gap-2">
          {!simulationRunning ? (
            <button
              onClick={handleStart}
              disabled={loadingAction === 'start'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(237,239,242,0.18)] hover:bg-[rgba(237,239,242,0.28)] border border-[rgba(255,255,255,0.30)] text-white font-semibold text-xs tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              START SIMULATION
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePause}
                disabled={loadingAction === 'pause'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(211,214,218,0.10)] hover:bg-[rgba(211,214,218,0.18)] text-[#F1F2F3] border border-[rgba(230,233,237,0.18)] text-xs font-medium transition cursor-pointer disabled:opacity-40"
                title={simulationPaused ? 'Resume Simulation Clock' : 'Pause Simulation Clock'}
              >
                {simulationPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current text-[#E9AE58]" />
                    <span>RESUME</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current text-[#E9AE58]" />
                    <span>PAUSE</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStop}
                disabled={loadingAction === 'stop'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(240,93,105,0.12)] hover:bg-[rgba(240,93,105,0.20)] text-[#F05D69] border border-[rgba(240,93,105,0.28)] text-xs font-medium transition cursor-pointer disabled:opacity-40"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>STOP</span>
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            disabled={loadingAction === 'reset'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(211,214,218,0.08)] hover:bg-[rgba(211,214,218,0.15)] text-[#B7BBC0] hover:text-[#F1F2F3] border border-[rgba(230,233,237,0.15)] text-xs font-medium transition cursor-pointer disabled:opacity-40"
            title="Reset simulation data to default baseline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>
    </header>
  );
}
