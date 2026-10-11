'use client';

import React, { useState } from 'react';
import { useMedSyncWebSocket } from '../hooks/useMedSyncWebSocket';
import { Header } from '../components/Header';
import { Sidebar, NavTab } from '../components/Sidebar';
import { OverviewTab } from '../components/tabs/OverviewTab';
import { DoctorsTab } from '../components/tabs/DoctorsTab';
import { AssignmentsTab } from '../components/tabs/AssignmentsTab';
import { PatientsTab } from '../components/tabs/PatientsTab';
import { EmergencyQueueTab } from '../components/tabs/EmergencyQueueTab';
import { ProcessMonitorTab } from '../components/tabs/ProcessMonitorTab';
import { IPCInspectorTab } from '../components/tabs/IPCInspectorTab';
import { RaceConditionLabTab } from '../components/tabs/RaceConditionLabTab';
import { AnalyticsTab } from '../components/tabs/AnalyticsTab';
import { EventLogsTab } from '../components/tabs/EventLogsTab';
import { SystemSettingsTab } from '../components/tabs/SystemSettingsTab';
import { DocumentationTab } from '../components/tabs/DocumentationTab';

const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Dashboard',
  doctors: 'Doctors & Staff Directory',
  assignments: 'Attending Registry',
  patients: 'Live Patients & Triage',
  queue: 'Emergency Priority Queue',
  processes: 'Process Monitor (fork & PIDs)',
  ipc: 'IPC Inspector (SHM & Semaphores)',
  race_lab: 'Race Condition Lab',
  analytics: 'Analytics & Telemetry',
  logs: 'System Event Logs',
  settings: 'System Configuration',
  docs: 'Architecture Documentation',
};

export default function DashboardPage() {
  const { state, connectionStatus, lastUpdatedTime, refreshState } = useMedSyncWebSocket();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const criticalCount = state.patients.filter((p) => p.priority === 1 && p.treatment_status !== 3).length;
  const waitingCount = state.patients.filter((p) => p.treatment_status === 0).length;

  return (
    <div className="min-h-screen ambient-bg-mesh p-2 sm:p-4 lg:p-6 flex flex-col justify-center relative">
      {/* Outer Floating Glass Frame (Matches Reference Image UI) */}
      <div className="glass-outer-shell flex flex-col flex-1 overflow-hidden min-h-[92vh] z-10">
        {/* Header with Title, Reference Metrics & Profile */}
        <Header
          simulationRunning={state.simulation_running}
          simulationPaused={state.simulation_paused}
          connectionStatus={connectionStatus}
          lastUpdated={lastUpdatedTime}
          onRefresh={refreshState}
          title={TAB_TITLES[currentTab]}
          totalPatients={state.patients.length}
          totalDoctors={state.doctors.length}
          totalQueue={waitingCount}
        />

        {/* Main Body with Sidebar + Tab Content */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            criticalCount={criticalCount}
            waitingCount={waitingCount}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white/20">
            {currentTab === 'overview' && (
              <OverviewTab state={state} onNavigateTab={setCurrentTab} />
            )}

            {currentTab === 'doctors' && (
              <DoctorsTab
                state={state}
                onRefresh={refreshState}
                onNavigateToAssignments={() => setCurrentTab('assignments')}
              />
            )}

            {currentTab === 'assignments' && (
              <AssignmentsTab
                state={state}
                onRefresh={refreshState}
              />
            )}

            {currentTab === 'patients' && (
              <PatientsTab state={state} onRefresh={refreshState} />
            )}

            {currentTab === 'queue' && (
              <EmergencyQueueTab state={state} onNavigateTab={setCurrentTab} />
            )}

            {currentTab === 'processes' && (
              <ProcessMonitorTab state={state} onRefresh={refreshState} />
            )}

            {currentTab === 'ipc' && <IPCInspectorTab state={state} />}

            {currentTab === 'race_lab' && (
              <RaceConditionLabTab onRefresh={refreshState} />
            )}

            {currentTab === 'analytics' && <AnalyticsTab state={state} />}

            {currentTab === 'logs' && (
              <EventLogsTab state={state} onRefresh={refreshState} />
            )}

            {currentTab === 'settings' && <SystemSettingsTab />}

            {currentTab === 'docs' && <DocumentationTab />}
          </main>
        </div>
      </div>
    </div>
  );
}
