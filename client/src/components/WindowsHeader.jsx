import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, RefreshCw, Bell, Sun, Moon, CheckCircle2, WifiOff, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import syncService from '../services/syncService';

export default function WindowsHeader({
  userName = "User",
  userEmail = "",
  selectedMonth = "2026-11",
  availableMonths = [],
  onSelectMonth,
  onOpenNotifications,
  onOpenProfile,
  onLogout,
  hasUnreadNotifications = false,
  onRefresh
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [syncState, setSyncState] = useState({
    status: syncService.status,
    isSyncing: syncService.isSyncing,
    pendingCount: syncService.getQueue().length,
    lastSyncTime: syncService.lastSyncTime
  });

  useEffect(() => {
    const unsub = syncService.subscribe((state) => {
      setSyncState(state);
    });
    return unsub;
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'all') return 'All Time';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const handleSync = async () => {
    try {
      await syncService.syncNow();
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  };

  const initials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RS';

  const isSyncing = syncState.isSyncing;
  const isOffline = syncState.status === 'offline';
  const syncLabel = isOffline 
    ? `Offline (${syncState.pendingCount} pending)`
    : isSyncing 
      ? 'Syncing...' 
      : syncService.getFormattedLastSync();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          {getGreeting()}, {userName.split(' ')[0]} <span className="animate-pulse">👋</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Here's your expense summary
        </p>
      </div>

      {/* Action Controls Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Month Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs hover:border-purple-300 dark:hover:border-purple-500 transition-colors cursor-pointer"
          >
            <Calendar size={15} className="text-[#6C47FF] dark:text-[#A78BFA]" />
            <span>{formatMonthName(selectedMonth)}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#1A172B] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 py-1.5 z-40 max-h-64 overflow-y-auto">
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onSelectMonth(m);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors ${
                      selectedMonth === m
                        ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{formatMonthName(m)}</span>
                    {selectedMonth === m && <CheckCircle2 size={13} className="text-purple-600 dark:text-purple-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sync Status Badge (Mint Green) */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          title="Click to perform two-way synchronization with Google Sheets"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
            isOffline
              ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70'
          }`}
        >
          {isOffline ? (
            <WifiOff size={14} className="text-amber-600 dark:text-amber-400" />
          ) : (
            <RefreshCw size={14} className={`text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          )}
          <span className="hidden md:inline">{syncLabel}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-amber-300 shadow-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-white/5 relative transition-colors cursor-pointer"
        >
          <Bell size={17} />
          {hasUnreadNotifications && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full ring-2 ring-white dark:ring-[#16132A]" />
          )}
        </button>

        {/* User Avatar with Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#381285] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity cursor-pointer ring-2 ring-purple-500/20"
          >
            {initials}
          </button>

          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1A172B] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-40 space-y-1 animate-slide-up">
                {/* Profile Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {userName}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {userEmail}
                  </span>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Authorized Google Account</span>
                  </span>
                </div>

                {/* Profile Actions */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Account Settings</span>
                </button>

                {/* Log Out */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
