import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Bell, CheckCircle2, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
  emailVerified = false,
  onResendVerification
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setDropdownOpen(false);
      }
    }
    if (profileOpen || dropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileOpen, dropdownOpen]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', 'Good Morning');
    if (hour < 17) return t('goodAfternoon', 'Good Afternoon');
    return t('goodEvening', 'Good Evening');
  };

  const getTodayDateString = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
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
          <p className="text-[11px] text-slate-500 dark:text-[#A78BFA] mt-0.5 flex items-center gap-1.5 truncate">
            <Calendar size={11} className="text-[#6C47FF] dark:text-[#C084FC] shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">{getTodayDateString()}</span>
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

          {/* Avatar Pill with Profile Menu (includes Notifications badge and menu row) */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile and Settings"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#381285] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-xs hover:opacity-95 transition-opacity cursor-pointer ring-2 ring-purple-500/20 relative"
            >
              {initials}
              {hasUnreadNotifications && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full ring-2 ring-white dark:ring-[#16132A]" />
              )}
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
                      if (onOpenNotifications) onOpenNotifications();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-[#6C47FF] dark:text-[#A78BFA]" />
                      <span>{t('notifications', 'Notifications')}</span>
                    </div>
                    {hasUnreadNotifications && (
                      <span className="w-2 h-2 rounded-full bg-[#6C47FF] dark:bg-[#C084FC]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <User size={14} className="text-slate-400" />
                    <span>{t('accountSettings', 'Account Settings')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>{t('logOut', 'Log Out')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
