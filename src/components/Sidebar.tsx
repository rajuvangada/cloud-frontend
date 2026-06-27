import React from 'react';
import type { ViewType } from '../types';
import {
  LayoutDashboard,
  Calculator,
  Terminal,
  Activity,
  Settings,
  Cloud,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isOpen,
  onToggle,
}) => {
  const menuItems = [
    { id: 'dashboard' as ViewType, name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cost' as ViewType, name: 'Cost Estimator', icon: <Calculator className="w-5 h-5" /> },
    { id: 'logs' as ViewType, name: 'Log Analyzer', icon: <Terminal className="w-5 h-5" /> },
    { id: 'api' as ViewType, name: 'API Health', icon: <Activity className="w-5 h-5" /> },
    { id: 'settings' as ViewType, name: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop for sidebar drawer */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar shell */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 transition-all duration-300 flex flex-col ${
          isOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-linear-to-tr from-linear to-aws text-white flex-shrink-0 shadow-sm animate-glow">
              <Cloud className="w-5 h-5" />
            </div>
            {isOpen && (
              <span className="font-bold text-base tracking-tight whitespace-nowrap bg-linear-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                CloudInsight <span className="text-[10px] text-linear dark:text-aws align-super font-semibold tracking-normal uppercase ml-0.5">Lite</span>
              </span>
            )}
          </div>
          
          {/* Close button for mobile sidebar drawer */}
          <button
            onClick={onToggle}
            className="lg:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  // Auto close drawer on mobile after selection
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                {/* Active border tab indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-linear dark:bg-aws" />
                )}

                <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-linear dark:text-aws' : ''}`}>
                  {item.icon}
                </div>

                {isOpen && <span className="truncate">{item.name}</span>}

                {/* Tooltip on collapsed state */}
                {!isOpen && (
                  <div className="absolute left-16 scale-0 group-hover:scale-100 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs px-2.5 py-1.5 rounded-md font-semibold shadow-md whitespace-nowrap transition-all duration-150 z-50 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info (only visible when expanded) */}
        {isOpen && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 text-xs text-zinc-400 dark:text-zinc-500 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span>Cloud Status</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div>v1.0.0 (Serverless)</div>
          </div>
        )}
      </aside>
    </>
  );
};
