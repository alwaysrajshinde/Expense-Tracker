import React, { useState } from 'react';
import { Calendar, ChevronDown, Bell, CheckCircle2, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  userName = "User",
  userEmail = "",
  selectedMonth = "2026-11",
  availableMonths = [],
  onSelectMonth,
  onOpenNotifications,
  onOpenProfile,
  onLogout,
  hasUnreadNotifications = false,
  activeTab = 'home',
  authProvider = 'password',
  emailVerified = true,
  onResendVerification
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Time-based greeting
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

  const initials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RS';

  return (
    <header className="px-5 pt-4 pb-2 relative">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors truncate">
            <span className="truncate">{getGreeting()}, {userName.split(' ')[0]}</span> <span className="animate-pulse flex-shrink-0">👋</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Personal Expense Tracker
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-amber-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-xs cursor-pointer"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 relative transition-colors shadow-xs cursor-pointer"
          >
            <Bell size={16} />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full ring-2 ring-white dark:ring-[#16132A]" />
            )}
          </button>

          {/* Avatar Pill with Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile and Settings"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#381285] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-xs hover:opacity-95 transition-opacity cursor-pointer ring-2 ring-purple-500/20"
            >
              {initials}
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1A172B] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-40 space-y-1 animate-slide-up">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {userName}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {userEmail}
                    </span>
                    {authProvider === 'google.com' ? (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                        <CheckCircle2 size={11} />
                        <span>Google Account</span>
                      </span>
                    ) : emailVerified ? (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                        <CheckCircle2 size={11} />
                        <span>Email Verified</span>
                      </span>
                    ) : (
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          <span>Pending Verification</span>
                        </span>
                        {onResendVerification && (
                          <button
                            onClick={onResendVerification}
                            className="text-[10px] text-[#6C47FF] dark:text-[#A78BFA] font-bold hover:underline cursor-pointer"
                          >
                            Resend
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <User size={14} className="text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
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

      {/* Month Selector Pill - Show only on relevant financial views (Home, Transactions, Reports) */}
      {['home', 'transactions', 'reports'].includes(activeTab) && (
        <div className="relative mt-3 inline-block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#16132A] border border-slate-200/90 dark:border-white/10 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs hover:border-purple-300 dark:hover:border-purple-500 transition-colors cursor-pointer"
          >
            <Calendar size={13} className="text-[#6C47FF] dark:text-[#A78BFA]" />
            <span>{formatMonthName(selectedMonth)}</span>
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#1A172B] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 py-1.5 z-40 max-h-60 overflow-y-auto">
                {availableMonths.map(m => (
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
      )}
    </header>
  );
}
