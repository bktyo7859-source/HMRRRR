'use client';

import React, { useState } from 'react';
import { ScrollText, Search, Download, Filter, RefreshCw, X } from 'lucide-react';
import { SimulationState, EventLog } from '../../lib/types';

interface EventLogsTabProps {
  state: SimulationState;
  onRefresh: () => void;
}

export function EventLogsTab({ state, onRefresh }: EventLogsTabProps) {
  const { recent_events } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  const filteredEvents = recent_events.filter((ev) => {
    const matchesSearch =
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'ALL' || ev.source === sourceFilter;
    const matchesResult = resultFilter === 'ALL' || ev.result === resultFilter;
    return matchesSearch && matchesSource && matchesResult;
  });

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Source', 'EventType', 'PID', 'PatientID', 'Result', 'Description'];
    const rows = filteredEvents.map((e) => [
      e.id,
      new Date(e.timestamp * 1000).toISOString(),
      e.source,
      e.event_type,
      e.pid,
      e.patient_id,
      e.result,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medsync_audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.24)]">SUCCESS</span>;
      case 'ALERT':
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#F05D69]/20 text-[#F05D69] border border-[#F05D69]/40">CRITICAL</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono glass-panel-light text-[#D3D6DA] border border-[rgba(255,255,255,0.15)]">ACTIVE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[rgba(255,255,255,0.06)] text-[#858B92]">{result}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-2xl glass-panel-dark">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#858B92]" />
            <input
              type="text"
              placeholder="Search audit trail by description or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] placeholder-[#858B92]"
            />
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
          >
            <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Sources</option>
            <option value="PATIENT_MONITOR" className="bg-[#191B1E] text-[#F1F2F3]">Patient Monitor</option>
            <option value="DISPATCHER" className="bg-[#191B1E] text-[#F1F2F3]">Dispatcher</option>
            <option value="DOCTOR" className="bg-[#191B1E] text-[#F1F2F3]">Doctor Worker</option>
            <option value="SYS" className="bg-[#191B1E] text-[#F1F2F3]">System Controller</option>
            <option value="IPC_KERNEL" className="bg-[#191B1E] text-[#F1F2F3]">IPC Kernel</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs text-[#F1F2F3] cursor-pointer"
          >
            <option value="ALL" className="bg-[#191B1E] text-[#F1F2F3]">All Results</option>
            <option value="SUCCESS" className="bg-[#191B1E] text-[#F1F2F3]">Success</option>
            <option value="CRITICAL" className="bg-[#191B1E] text-[#F1F2F3]">Critical Alert</option>
            <option value="IN_PROGRESS" className="bg-[#191B1E] text-[#F1F2F3]">In Progress</option>
          </select>

          {(searchTerm || sourceFilter !== 'ALL' || resultFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSourceFilter('ALL');
                setResultFilter('ALL');
              }}
              className="flex items-center gap-1 text-xs text-[#B7BBC0] hover:text-[#F1F2F3] hover:underline cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl glass-btn text-[#858B92] hover:text-[#F1F2F3] transition cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn text-[#F1F2F3] text-xs font-semibold transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#B7BBC0]" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl glass-panel-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(30,32,35,0.7)] text-[#858B92] font-mono uppercase text-[10px] border-b border-[rgba(230,233,237,0.12)]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source Process</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">OS PID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[rgba(211,214,218,0.06)] transition">
                  <td className="py-2.5 px-4 text-[#858B92]">
                    {new Date(ev.timestamp * 1000).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded glass-panel-light text-[#F1F2F3] border border-[rgba(255,255,255,0.18)] text-[10px]">
                      {ev.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#F1F2F3] font-semibold">{ev.event_type}</td>
                  <td className="py-2.5 px-4 text-[#858B92]">{ev.pid || 'KERNEL'}</td>
                  <td className="py-2.5 px-4 text-[#858B92]">
                    {ev.patient_id !== -1 ? `#${ev.patient_id}` : '-'}
                  </td>
                  <td className="py-2.5 px-4">{getResultBadge(ev.result)}</td>
                  <td className="py-2.5 px-4 text-[#F1F2F3] max-w-md truncate">{ev.description}</td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#858B92]">
                    No events matching current filter.
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
