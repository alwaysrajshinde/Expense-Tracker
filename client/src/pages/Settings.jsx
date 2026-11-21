import React, { useState, useRef, useEffect } from 'react';
import {
  DollarSign, User, Tag, Download, Upload, Database, Check, AlertCircle,
  Plus, Trash2, RefreshCw, FileSpreadsheet, ShieldCheck, Sun, Moon, Sparkles,
  ExternalLink, LogOut, Bell, Info, Shield, HelpCircle, Palette, Key, CheckCircle2
} from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import LegalModal from '../components/LegalModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportTransactionsToExcel, exportDataToJson } from '../services/exportService';

export default function Settings({
  settings = {},
  categories = [],
  initialSection = 'preferences',
  onUpdateSettings,
  onUpdateBudget,
  onAddCategory,
  onDeleteCategory,
  onImportFile,
  onRestoreBackup,
  onRefreshAll,
  formatCurrency,
  selectedMonth,
  onLogout,
  onOpenTour,
  onOpenReleaseNotes
}) {
  const { theme, setTheme, toggleTheme, isDark, availableThemes } = useTheme();
  const { showToast } = useToast();
  const { user, logout, resendVerificationEmail, resetPassword } = useAuth();

  // Normalize initial section to the 4 main groups
  const normalizeSection = (sec) => {
    if (sec === 'budget' || sec === 'categories' || sec === 'preferences') return 'preferences';
    if (sec === 'profile' || sec === 'account' || sec === 'security') return 'account';
    if (sec === 'data' || sec === 'backup' || sec === 'import_export') return 'data';
    if (sec === 'info' || sec === 'about') return 'info';
    return 'preferences';
  };

  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection));

  useEffect(() => {
    if (initialSection) {
      setActiveSection(normalizeSection(initialSection));
    }
  }, [initialSection]);

  // Budget State with automatic prop-sync
  const [budgetVal, setBudgetVal] = useState(() => settings.monthly_budget || '12000');
  const [userNameVal, setUserNameVal] = useState(() => settings.user_name || user?.name || 'User');
  const [currencyVal, setCurrencyVal] = useState(() => settings.currency || '₹');

  useEffect(() => {
    if (settings.monthly_budget !== undefined && settings.monthly_budget !== null && settings.monthly_budget !== '') {
      const num = parseFloat(settings.monthly_budget);
      if (!isNaN(num) && num > 0) {
        setBudgetVal(String(num));
      }
    }
  }, [settings.monthly_budget]);

  useEffect(() => {
    if (settings.user_name) setUserNameVal(settings.user_name);
    if (settings.currency) setCurrencyVal(settings.currency);
  }, [settings.user_name, settings.currency]);

  // Notification Preferences
  const [notify80, setNotify80] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('expense_tracker_notification_prefs') || '{}');
      return prefs.notify80 !== false;
    } catch (e) { return true; }
  });
  const [notify100, setNotify100] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('expense_tracker_notification_prefs') || '{}');
      return prefs.notify100 !== false;
    } catch (e) { return true; }
  });

  const handleTogglePref = (key, val) => {
    const nextPrefs = { notify80, notify100, [key]: val };
    if (key === 'notify80') setNotify80(val);
    if (key === 'notify100') setNotify100(val);
    localStorage.setItem('expense_tracker_notification_prefs', JSON.stringify(nextPrefs));
    showToast('Notification preference saved!', 'success');
  };

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#6C47FF');

  // Status message & loading
  const [statusMsg, setStatusMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restoreFilePending, setRestoreFilePending] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [legalModalType, setLegalModalType] = useState(null);

  const excelInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const numBudget = parseFloat(budgetVal);
      if (isNaN(numBudget) || numBudget < 0) {
        showToast('Please enter a valid budget amount', 'error');
        return;
      }
      await onUpdateBudget(selectedMonth, numBudget);
      await onUpdateSettings({ monthly_budget: String(numBudget) });
      setStatusMsg({ type: 'success', text: `Monthly target budget updated to ${formatCurrency(numBudget)}` });
      showToast(`Monthly budget set to ${formatCurrency(numBudget)}`, 'success');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update budget' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateSettings({ user_name: userNameVal, currency: currencyVal });
      setStatusMsg({ type: 'success', text: 'Profile preferences updated successfully' });
      showToast('Profile updated!', 'success');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await onAddCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
        is_quick: false
      });
      setNewCatName('');
      setStatusMsg({ type: 'success', text: `Category "${newCatName}" added successfully!` });
      showToast(`Category "${newCatName}" added!`, 'success');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to add category' });
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatusMsg({ type: 'info', text: 'Importing Excel ledger...' });
      const result = await onImportFile(file);
      setStatusMsg({
        type: 'success',
        text: `Successfully imported ${result.imported} transactions (${result.skipped} skipped)`
      });
      showToast(`Imported ${result.imported} transactions!`, 'success');
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to import Excel' });
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFilePending(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!restoreFilePending) return;
    try {
      setRestoring(true);
      const result = await onRestoreBackup(restoreFilePending);
      showToast(`Restored ${result.restored_transactions} transactions successfully!`, 'success');
      setStatusMsg({ type: 'success', text: `Restored ${result.restored_transactions} records from backup!` });
      setRestoreFilePending(null);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      showToast(err.message || 'Failed to restore backup', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      showToast(`Password reset link sent to ${user.email}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send password reset', 'error');
    }
  };

  const iconOptions = [
    'Tag', 'Utensils', 'ShoppingBag', 'Car', 'Shirt', 'Zap',
    'Home', 'HeartPulse', 'Film', 'GraduationCap', 'Compass',
    'Sparkles', 'CreditCard', 'Coffee', 'Apple', 'Smartphone'
  ];

  const colorOptions = [
    '#6C47FF', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#6366F1',
    '#EF4444', '#8B5CF6', '#0EA5E9', '#F97316', '#F43F5E', '#64748B'
  ];

  return (
    <div className="space-y-5 px-4 sm:px-6 lg:px-8 py-4 pb-24 lg:pb-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Settings &amp; Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account, financial budgets, categories, and personal data backups
        </p>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : statusMsg.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100 text-base cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* 4 Clean Primary Section Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveSection('account')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'account'
              ? 'bg-[#6C47FF] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <User size={14} />
          <span>Account</span>
        </button>

        <button
          onClick={() => setActiveSection('preferences')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'preferences'
              ? 'bg-[#6C47FF] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <DollarSign size={14} />
          <span>Preferences</span>
        </button>

        <button
          onClick={() => setActiveSection('data')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'data'
              ? 'bg-[#6C47FF] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Database size={14} />
          <span>Data Backup</span>
        </button>

        <button
          onClick={() => setActiveSection('info')}
          className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'info'
              ? 'bg-[#6C47FF] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Info size={14} />
          <span>Information</span>
        </button>
      </div>

      {/* ========================================================
          SECTION 1: ACCOUNT & SECURITY
         ======================================================== */}
      {activeSection === 'account' && (
        <div className="space-y-5 animate-fade-in">
          {/* Profile Details Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white font-bold text-base flex items-center justify-center shadow-md shadow-purple-600/20">
                {(user?.name || user?.email || 'RS').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Active Account'}
                </h3>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                <div className="mt-1 flex items-center gap-2">
                  {user?.isGoogleUser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                      <CheckCircle2 size={11} />
                      <span>Google Account Verified</span>
                    </span>
                  ) : user?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                      <CheckCircle2 size={11} />
                      <span>Email Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                      <AlertCircle size={11} />
                      <span>Pending Email Verification</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userNameVal}
                    onChange={(e) => setUserNameVal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    value={currencyVal}
                    onChange={(e) => setCurrencyVal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  >
                    <option value="₹">₹ - Indian Rupee (INR)</option>
                    <option value="$">$ - US Dollar (USD)</option>
                    <option value="€">€ - Euro (EUR)</option>
                    <option value="£">£ - British Pound (GBP)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile Preferences'}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Sign Out Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={16} className="text-[#6C47FF]" />
              <span>Account Security &amp; Session</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {!user?.isGoogleUser && (
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 text-left space-y-1 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6C47FF]">
                      Reset Password
                    </span>
                    <Key size={14} className="text-slate-400 group-hover:text-[#6C47FF]" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Send password reset instructions to your registered email address
                  </p>
                </button>
              )}

              {user && !user.emailVerified && !user.isGoogleUser && (
                <button
                  type="button"
                  onClick={async () => {
                    await resendVerificationEmail();
                    showToast('Verification email resent!', 'success');
                  }}
                  className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Resend Verification Link
                    </span>
                    <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Send a fresh email verification link to confirm account ownership
                  </p>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout || logout}
                className="p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 text-left space-y-1 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    Sign Out / Disconnect
                  </span>
                  <LogOut size={14} className="text-rose-600 dark:text-rose-400" />
                </div>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  Safely log out of your personal financial vault on this device
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 2: PREFERENCES & BUDGET
         ======================================================== */}
      {activeSection === 'preferences' && (
        <div className="space-y-5 animate-fade-in">
          {/* Target Monthly Budget Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Target Budget
                </h3>
                <p className="text-xs text-slate-400">
                  Controls your dashboard spending gauges, budget pace, and warnings
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Amount ({currencyVal})
                </label>
                <div className="relative max-w-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                    {currencyVal}
                  </span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Synchronized with Dashboard overview, monthly remaining balance, and analytics reports.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check size={15} />
                <span>{saving ? 'Saving...' : 'Save Target Budget'}</span>
              </button>
            </form>
          </div>

          {/* Spending Alert Preferences Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spending &amp; Budget Alerts
                </h3>
                <p className="text-xs text-slate-400">
                  Configure active notifications when spending approaches target thresholds
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    80% Budget Warning
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Warn when monthly expenses reach 80% of your configured budget
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notify80}
                  onChange={(e) => handleTogglePref('notify80', e.target.checked)}
                  className="w-5 h-5 accent-[#6C47FF] rounded-lg cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    100% Budget Exceeded Limit
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Display alert when expenses exceed total monthly budget
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notify100}
                  onChange={(e) => handleTogglePref('notify100', e.target.checked)}
                  className="w-5 h-5 accent-[#6C47FF] rounded-lg cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Theme & Appearance Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Appearance &amp; Theme
                </h3>
                <p className="text-xs text-slate-400">
                  Select your preferred visual styling across mobile and desktop
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {availableThemes.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      active
                        ? 'border-[#6C47FF] bg-purple-50/60 dark:bg-purple-950/40 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                      {active && <Check size={14} className="text-[#6C47FF]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      {t.id === 'light' ? 'Light Theme' : t.id === 'dark' ? 'Dark Purple' : t.id === 'midnight' ? 'High Contrast OLED' : 'Emerald Green'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Management Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Expense Categories ({categories.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Standard starter categories and user-defined custom categories
                  </p>
                </div>
              </div>
            </div>

            {/* Create Custom Category Form */}
            <form onSubmit={handleCreateCategory} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-3.5 border border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                + Add Custom Category
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Category name (e.g., Subscriptions, Books...)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#151226] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151226] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  >
                    {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <select
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151226] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  >
                    {colorOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id || c.name}
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${c.color || '#6C47FF'}20` }}
                    >
                      <CategoryIcon name={c.name} icon={c.icon} color={c.color} size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {c.name}
                    </span>
                  </div>
                  {c.id && c.id > 100 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(c.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete custom category"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 3: DATA MANAGEMENT & BACKUPS
         ======================================================== */}
      {activeSection === 'data' && (
        <div className="space-y-5 animate-fade-in">
          {/* Export Options Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download size={16} className="text-[#6C47FF]" />
              <span>Export Your Ledgers &amp; Backups</span>
            </h3>
            <p className="text-xs text-slate-400">
              Download complete, unencrypted exports of all your expense records anytime
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <a
                href={`/api/export/excel?user_email=${encodeURIComponent(user?.email || '')}`}
                onClick={(e) => {
                  if (window.location.hostname.includes('github.io') || !window.location.port) {
                    e.preventDefault();
                    exportTransactionsToExcel([], `Expenses_${selectedMonth || 'all'}.xlsx`);
                  }
                }}
                download="Daily_Expenses_Export.xlsx"
                className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-600/40 text-left space-y-1.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                    Microsoft Excel (.xlsx)
                  </span>
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Formatted spreadsheet compatible with Microsoft Excel, Apple Numbers, and Google Sheets
                </p>
              </a>

              <a
                href={`/api/export/json?user_email=${encodeURIComponent(user?.email || '')}`}
                onClick={(e) => {
                  if (window.location.hostname.includes('github.io') || !window.location.port) {
                    e.preventDefault();
                    exportDataToJson({}, `expense_tracker_backup.json`);
                  }
                }}
                download="expense_tracker_backup.json"
                className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-600/40 text-left space-y-1.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6C47FF]">
                    Full JSON Database Backup
                  </span>
                  <Database size={18} className="text-[#6C47FF]" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Complete structured data snapshot for local storage, migration, or future restore
                </p>
              </a>
            </div>
          </div>

          {/* Import & Restore Options Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload size={16} className="text-[#6C47FF]" />
              <span>Import &amp; Restore</span>
            </h3>
            <p className="text-xs text-slate-400">
              Import past Excel ledgers or restore your account from a JSON backup file
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-white/15 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Import Excel Ledger
                  </span>
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Select an Excel file (.xlsx) with columns for Date, Category, Amount, and Description
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={excelInputRef}
                  onChange={handleImportExcel}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Select Excel File (.xlsx)
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-white/15 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Restore JSON Backup
                  </span>
                  <Database size={16} className="text-[#6C47FF]" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Restore past transactions and categories from an Expense Tracker JSON export
                </p>
                <input
                  type="file"
                  accept=".json"
                  ref={jsonInputRef}
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jsonInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Select JSON Backup (.json)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 4: APP INFORMATION & HELP
         ======================================================== */}
      {activeSection === 'info' && (
        <div className="space-y-5 animate-fade-in">
          {/* App Info Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal Expense Tracker
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Private financial accounting application with isolated cloud storage
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/40 text-[#6C47FF] dark:text-[#A78BFA] rounded-full text-xs font-extrabold">
                Version 1.2.0
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenReleaseNotes}
                className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 text-left space-y-1 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6C47FF]">
                    What's New in v1.2.0
                  </span>
                  <Sparkles size={14} className="text-[#6C47FF]" />
                </div>
                <p className="text-[11px] text-slate-400">
                  View changelog, bug fixes, and feature improvements
                </p>
              </button>

              <button
                type="button"
                onClick={onOpenTour}
                className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 text-left space-y-1 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6C47FF]">
                    Replay Tour
                  </span>
                  <HelpCircle size={14} className="text-[#6C47FF]" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Walk through the application features, charts, and shortcuts
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLegalModalType('privacy')}
                className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 text-left space-y-1 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6C47FF]">
                    Privacy &amp; Security
                  </span>
                  <ShieldCheck size={14} className="text-[#6C47FF]" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Review sovereign data rights and cryptographic isolation
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Restore */}
      {restoreFilePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#16132A] rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Data Restore</h4>
                <p className="text-xs text-slate-400">File: {restoreFilePending.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Restoring from this backup will merge historical transactions and custom categories into your vault.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreFilePending(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={executeRestore}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#6C47FF] hover:bg-[#5B32EA] text-white shadow-xs cursor-pointer"
              >
                {restoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal Trigger */}
      <LegalModal
        isOpen={Boolean(legalModalType)}
        onClose={() => setLegalModalType(null)}
        initialTab={legalModalType || 'privacy'}
      />
    </div>
  );
}
