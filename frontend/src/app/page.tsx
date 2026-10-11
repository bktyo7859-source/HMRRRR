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

export default function DashboardPage() {
  const { state, connectionStatus, lastUpdatedTime, refreshState } = useMedSyncWebSocket();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const criticalCount = state.patients.filter((p) => p.priority === 1 && p.treatment_status !== 3).length;
  const waitingCount = state.patients.filter((p) => p.treatment_status === 0).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#101113] ambient-bg-mesh text-[#F1F2F3] relative">
      {/* Top Header */}
      <Header
        simulationRunning={state.simulation_running}
        simulationPaused={state.simulation_paused}
        connectionStatus={connectionStatus}
        lastUpdated={lastUpdatedTime}
        onRefresh={refreshState}
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

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
  );
}
