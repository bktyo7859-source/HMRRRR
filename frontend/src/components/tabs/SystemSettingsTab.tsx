'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Server, Terminal, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchSystemInfo } from '../../lib/api';

export function SystemSettingsTab() {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemInfo();
      setSysInfo(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* System Information Card */}
      <div className="p-6 rounded-2xl glass-panel-dark">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <h3 className="text-base font-bold text-[#F1F2F3] flex items-center gap-2">
              <Server className="h-4 w-4 text-[#F1F2F3]" />
              Host Runtime & IPC Subsystem Environment
            </h3>
            <p className="text-xs text-[#858B92]">
              Detected operating system capabilities and IPC kernel layer
            </p>
          </div>
          <button
            onClick={loadInfo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn text-[#F1F2F3] text-xs transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#B7BBC0] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {sysInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92] block text-[10px]">HOST OS PLATFORM</span>
              <span className="text-[#F1F2F3] font-bold text-sm">{sysInfo.os.toUpperCase()}</span>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92] block text-[10px]">C++ COMPILER</span>
              <span className="text-[#D3D6DA] font-bold text-sm">{sysInfo.compiler}</span>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92] block text-[10px]">ACTIVE IPC MODE</span>
              <span className="text-[#F1F2F3] font-bold">{sysInfo.ipc_mode}</span>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.08)]">
              <span className="text-[#858B92] block text-[10px]">C++ SIMULATION EXECUTABLE</span>
              <span className="text-[#F1F2F3] truncate block" title={sysInfo.cpp_executable}>
                {sysInfo.cpp_executable}
              </span>
              <span className="text-[10px] text-[#F1F2F3] font-bold">
                {sysInfo.executable_exists ? '✓ BINARY VERIFIED' : '✗ NOT FOUND'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Linux / Ubuntu Cross-Platform Instructions */}
      <div className="p-6 rounded-2xl glass-panel-dark">
        <div className="flex items-center gap-2 mb-2 text-[#F1F2F3]">
          <Terminal className="h-4 w-4 text-[#F1F2F3]" />
          <h3 className="text-sm font-bold text-[#F1F2F3]">Linux / Ubuntu & Docker Deployment Guide</h3>
        </div>
        <p className="text-xs text-[#B7BBC0] mb-4 leading-relaxed">
          The C++ codebase is strictly compliant with Linux System V IPC standards (<code className="text-[#F1F2F3] font-mono">sys/shm.h</code>, <code className="text-[#F1F2F3] font-mono">sys/sem.h</code>, <code className="text-[#F1F2F3] font-mono">sys/msg.h</code>). On Ubuntu, run the following automated shell scripts:
        </p>

        <div className="p-4 rounded-xl glass-panel-light border border-[rgba(255,255,255,0.10)] font-mono text-xs text-[#F1F2F3] space-y-1.5">
          <div className="text-[#858B92]"># 1. Compile C++ engine on Linux / Ubuntu:</div>
          <div>cd cpp && make</div>
          <div className="text-[#858B92] pt-2"># 2. Run standalone race condition experiments:</div>
          <div>./medsync_sim --race-counter unsafe 10000</div>
          <div>./medsync_sim --race-counter protected 10000</div>
          <div className="text-[#858B92] pt-2"># 3. Start complete FastAPI + Next.js stack:</div>
          <div>./scripts/run.sh</div>
        </div>
      </div>
    </div>
  );
}
