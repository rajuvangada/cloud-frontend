import React, { useState, useEffect, useRef } from 'react';
import type { ThemeType, User, ViewType } from '../types';
import { Sun, Moon, Bell, Menu, User as UserIcon, LogOut, Settings, HelpCircle, ArrowRight } from 'lucide-react';

interface HeaderProps {
  theme: ThemeType;
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onViewChange: (view: ViewType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeToggle,
  onSidebarToggle,
  currentUser,
  onLogout,
  onViewChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 'n-1',
      title: 'AWS Savings Alert',
      desc: 'Suggest switching 24/7 instances to Savings Plans to cut up to 30% off monthly bills.',
      time: '10m ago',
      unread: true,
      category: 'cost',
    },
    {
      id: 'n-2',
      title: 'Critical DB Refusal',
      desc: 'Log Analyzer caught "Connection Refused" status inside service lambda backend.',
      time: '25m ago',
      unread: true,
      category: 'health',
    },
    {
      id: 'n-3',
      title: 'API Gateway Health Good',
      desc: 'Latency is stable at 45ms. System is fully operational.',
      time: '2h ago',
      unread: false,
      category: 'health',
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 lg:px-6 flex items-center justify-between">
      {/* Sidebar Toggle Burger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Mobile-only logo display */}
        <span className="lg:hidden font-bold text-sm bg-linear-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
          CloudInsight <span className="text-[10px] text-linear font-semibold align-super">Lite</span>
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={onThemeToggle}
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-zinc-950" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-semibold text-sm text-zinc-950 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex gap-3 ${
                      notif.unread ? 'bg-zinc-50/30 dark:bg-zinc-900/10' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        notif.category === 'cost' ? 'bg-aws' : 'bg-linear'
                      }`} />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white">{notif.title}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{notif.desc}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-center bg-zinc-50/50 dark:bg-zinc-950/10">
                <button className="text-xs text-linear dark:text-aws font-medium inline-flex items-center gap-1 hover:underline cursor-pointer">
                  Mark all as read <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="View user profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-linear to-aws p-0.5 hover:opacity-90 transition-opacity">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-800 dark:text-zinc-100">
                <UserIcon className="w-4 h-4 text-linear dark:text-aws" />
              </div>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{currentUser?.name || 'Developer User'}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{currentUser?.email || 'developer@cloudinsight.io'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onViewChange('dashboard');
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2.5 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" /> Personal Account
                </button>
                <button
                  onClick={() => {
                    onViewChange('settings');
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => {
                    window.location.href = 'mailto:support@cloudinsight.io';
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" /> Help Support
                </button>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 py-1">
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/15 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
