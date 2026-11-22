import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, RefreshCw, Bell, Sun, Moon, CheckCircle2, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
  onRefresh,
  activeTab = 'home',
  authProvider = 'password',
  emailVerified = false,
  onResendVerification
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', 'Good Morning');
    if (hour < 17) return t('goodAfternoon', 'Good Afternoon');
    return t('goodEvening', 'Good Evening');
  };

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'all') return 'All Time';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const initials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RS';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          {getGreeting()}, {userName.split(' ')[0]}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Here's your expense summary
        </p>
      </div>

      {/* Action Controls Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">

        {/* Refresh Data Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh expense records and dashboard"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-colors cursor-pointer bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/40 text-[#6C47FF] dark:text-[#A78BFA] hover:bg-purple-100/70"
        >
          <RefreshCw size={14} className={`text-[#6C47FF] dark:text-[#A78BFA] ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Refresh Data</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-amber-300 shadow-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Avatar with Profile Dropdown Menu (includes Notifications) */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#381285] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity cursor-pointer ring-2 ring-purple-500/20 relative"
          >
            {initials}
            {hasUnreadNotifications && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full ring-2 ring-white dark:ring-[#16132A]" />
            )}
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
