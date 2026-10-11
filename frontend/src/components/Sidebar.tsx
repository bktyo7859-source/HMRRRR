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
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'doctors' as NavTab, label: 'Doctors & Staff', icon: Stethoscope },
    { id: 'assignments' as NavTab, label: 'Attending Registry', icon: UserCheck },
    {
      id: 'patients' as NavTab,
      label: 'Live Patients',
      icon: Users,
      badge: criticalCount > 0 ? criticalCount : null,
      badgeColor: 'bg-[rgba(240,93,105,0.20)] text-[#F05D69] border border-[rgba(240,93,105,0.35)]',
    },
    {
      id: 'queue' as NavTab,
      label: 'Emergency Queue',
      icon: Flame,
      badge: waitingCount > 0 ? waitingCount : null,
      badgeColor: 'bg-[rgba(233,174,88,0.20)] text-[#E9AE58] border border-[rgba(233,174,88,0.35)]',
    },
    { id: 'processes' as NavTab, label: 'Process Monitor', icon: Cpu },
    { id: 'ipc' as NavTab, label: 'IPC Inspector', icon: Layers },
    { id: 'race_lab' as NavTab, label: 'Race Condition Lab', icon: FlaskConical },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'logs' as NavTab, label: 'Event Logs', icon: ScrollText },
    { id: 'settings' as NavTab, label: 'System Settings', icon: Settings },
    { id: 'docs' as NavTab, label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside
      className={`border-r border-[rgba(230,233,237,0.15)] bg-[rgba(38,40,43,0.66)] backdrop-blur-xl transition-all duration-300 flex flex-col justify-between select-none shadow-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-3">
        {/* Toggle Button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-[rgba(211,214,218,0.08)] hover:bg-[rgba(211,214,218,0.16)] text-[#B7BBC0] hover:text-[#FFFFFF] border border-[rgba(230,233,237,0.15)] transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-[rgba(237,239,242,0.16)] text-[#FFFFFF] border border-[rgba(255,255,255,0.24)] shadow-md shadow-black/20'
                    : 'text-[#B7BBC0] hover:bg-[rgba(211,214,218,0.08)] hover:text-[#FFFFFF] border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive ? 'text-[#FFFFFF]' : 'text-[#858B92]'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 text-left tracking-wide">{item.label}</span>
                )}

                {!collapsed && item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mono-font ${
                      item.badgeColor || 'bg-[rgba(211,214,218,0.12)] text-[#F1F2F3]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3.5 m-3 rounded-xl bg-[rgba(211,214,218,0.06)] border border-[rgba(230,233,237,0.12)] text-[11px] text-[#B7BBC0]">
          <div className="font-semibold text-[#F1F2F3] mb-1">Architecture Architecture</div>
          <p className="leading-relaxed text-[#858B92]">
            System V IPC Shared Memory & Process Sync Bridge
          </p>
          <div className="mt-2 text-[10px] text-[#F1F2F3] mono-font uppercase tracking-wider">
            Kernel Protocol Active
          </div>
        </div>
      )}
    </aside>
  );
}
