'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Flame,
  Cpu,
  Layers,
  FlaskConical,
  BarChart3,
  ScrollText,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  UserCheck,
  Hexagon,
  Activity,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'doctors'
  | 'assignments'
  | 'patients'
  | 'queue'
  | 'processes'
  | 'ipc'
  | 'race_lab'
  | 'analytics'
  | 'logs'
  | 'settings'
  | 'docs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  criticalCount: number;
  waitingCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  criticalCount,
  waitingCount,
}: SidebarProps) {
  const mainMenu = [
    { id: 'overview' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doctors' as NavTab, label: 'Doctors & Staff', icon: Stethoscope },
    { id: 'assignments' as NavTab, label: 'Attending Registry', icon: UserCheck },
    {
      id: 'patients' as NavTab,
      label: 'Live Patients',
      icon: Users,
      badge: criticalCount > 0 ? criticalCount : null,
      badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
    {
      id: 'queue' as NavTab,
      label: 'Emergency Queue',
      icon: Flame,
      badge: waitingCount > 0 ? waitingCount : null,
      badgeColor: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
  ];

  const systemMenu = [
    { id: 'processes' as NavTab, label: 'Process Monitor', icon: Cpu },
    { id: 'ipc' as NavTab, label: 'IPC Inspector', icon: Layers },
    { id: 'race_lab' as NavTab, label: 'Race Condition Lab', icon: FlaskConical },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'logs' as NavTab, label: 'Event Logs', icon: ScrollText },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
    { id: 'docs' as NavTab, label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside
      className={`border-r border-white/60 bg-white/40 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-orange-950/15">
                <Hexagon className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-lg text-stone-900 metric-font block leading-none">
                  MedSync
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide">
                  IPC OS LAB v4.2
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-center shadow-md">
              <Hexagon className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-white/60 transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Section 1: Main Menu */}
        <div className="mb-5">
          {!collapsed && (
            <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
              Main Menu
            </div>
          )}
          <nav className="space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-white/95 text-stone-900 shadow-sm border border-white/80 font-semibold'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-white/45 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive ? 'text-amber-600' : 'text-stone-400'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left tracking-wide">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mono-font ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Team & Systems Management */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
              Systems & IPC
            </div>
          )}
          <nav className="space-y-1">
            {systemMenu.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl font-medium text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-white/95 text-stone-900 shadow-sm border border-white/80 font-semibold'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-white/45 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive ? 'text-amber-600' : 'text-stone-400'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left tracking-wide">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-2xl bg-white/50 border border-white/80 text-[11px] text-stone-600 shadow-xs">
          <div className="flex items-center gap-1.5 text-stone-800 font-semibold mb-0.5">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            System V Primitives
          </div>
          <p className="text-[10px] text-stone-500 leading-snug">
            Zero-copy Shared Memory (0x1234) &amp; 3 Semaphores active.
          </p>
        </div>
      )}
    </aside>
  );
}
