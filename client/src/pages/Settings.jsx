import React, { useState, useRef, useEffect } from 'react';
import {
  DollarSign, User, Tag, Download, Upload, Database, Check, AlertCircle,
  Plus, Trash2, RefreshCw, FileSpreadsheet, ShieldCheck, Sun, Moon, Sparkles,
  ExternalLink, LogOut, Bell, Info, Shield, HelpCircle, Palette, Key, CheckCircle2,
  History, ChevronRight, Sliders, Target, FileText, ArrowLeftRight, X, ArrowRight
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
  initialSection = null,
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
  onOpenReleaseNotes,
  onOpenImport,
  onOpenImportHistory,
  onOpenNotifications,
  hasUnreadNotifs = false
}) {
  const { theme, setTheme, toggleTheme, isDark, availableThemes } = useTheme();
  const { showToast } = useToast();
  const { user, logout, resendVerificationEmail, resetPassword } = useAuth();

  // Active Sub-Modal: null | 'profile' | 'budget' | 'categories' | 'theme' | 'export' | 'security' | 'help'
  const [activeModal, setActiveModal] = useState(() => {
    if (initialSection === 'budget') return 'budget';
    if (initialSection === 'categories') return 'categories';
    if (initialSection === 'account' || initialSection === 'security') return 'security';
    if (initialSection === 'data' || initialSection === 'export') return 'export';
    return null;
  });

  useEffect(() => {
    if (initialSection === 'budget') setActiveModal('budget');
    else if (initialSection === 'categories') setActiveModal('categories');
    else if (initialSection === 'account' || initialSection === 'security') setActiveModal('security');
    else if (initialSection === 'data' || initialSection === 'export') setActiveModal('export');
  }, [initialSection]);

  // Budget State with automatic prop-sync
  const [budgetVal, setBudgetVal] = useState(() => settings.monthly_budget || '12000');
  const [userNameVal, setUserNameVal] = useState(() => settings.user_name || user?.name || user?.displayName || 'Raj Kumar');
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
    else if (user?.displayName) setUserNameVal(user.displayName);
    if (settings.currency) setCurrencyVal(settings.currency);
  }, [settings.user_name, user?.displayName, settings.currency]);

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
    if (e) e.preventDefault();
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
      setActiveModal(null);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update budget' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await onUpdateSettings({ user_name: userNameVal, currency: currencyVal });
      setStatusMsg({ type: 'success', text: 'Profile preferences updated successfully' });
      showToast('Profile updated!', 'success');
      setActiveModal(null);
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

  const handleExcelExport = async () => {
    try {
      setStatusMsg({ type: 'info', text: 'Generating comprehensive Excel ledger...' });
      await exportTransactionsToExcel();
      setStatusMsg({ type: 'success', text: 'Excel ledger exported successfully!' });
      showToast('Excel ledger downloaded!', 'success');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to export Excel file' });
    }
  };

  const handleJsonExport = async () => {
    try {
      setStatusMsg({ type: 'info', text: 'Creating full JSON data backup...' });
      await exportDataToJson();
      setStatusMsg({ type: 'success', text: 'JSON backup downloaded successfully!' });
      showToast('JSON backup downloaded!', 'success');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to export JSON backup' });
    }
  };

  const handleRestoreJson = async () => {
    if (!restoreFilePending) return;
    try {
      setRestoring(true);
      setStatusMsg({ type: 'info', text: 'Restoring transactions and categories...' });
      const result = await onRestoreBackup(restoreFilePending);
      setStatusMsg({
        type: 'success',
        text: `Successfully restored ${result.transactions_restored || 0} transactions and ${result.categories_restored || 0} categories!`
      });
      showToast('Data restored successfully!', 'success');
      setRestoreFilePending(null);
      if (onRefreshAll) onRefreshAll();
      setActiveModal(null);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to restore backup' });
    } finally {
      setRestoring(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const categoryIcons = [
    'Tag', 'Utensils', 'Car', 'ShoppingBag', 'Zap', 'Home',
    'HeartPulse', 'Film', 'GraduationCap', 'Plane', 'Sparkles', 'Coffee',
    'Wifi', 'Phone', 'BookOpen', 'Music', 'DollarSign', 'Gift'
  ];

  const colorOptions = [
    '#6C47FF', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#6366F1',
    '#EF4444', '#8B5CF6', '#0EA5E9', '#F97316', '#F43F5E', '#64748B'
  ];

  const userInitial = (userNameVal || user?.displayName || user?.email || 'R').charAt(0).toUpperCase();
  const isEmailVerified = Boolean(user?.emailVerified || user?.isGoogleUser);

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-8 py-3 pb-28 lg:pb-8 max-w-xl mx-auto transition-colors">
      
      {/* ========================================================
          1. SCREEN HEADER (Strictly matching Dark Violet Design)
         ======================================================== */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            More
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A78BFA]/80 mt-0.5">
            Settings, data management and support
          </p>
        </div>

        {/* Circular Notification Bell with unread dot */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1C1635] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-xs cursor-pointer"
        >
          <Bell size={18} />
          {hasUnreadNotifs && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#A855F7] ring-2 ring-white dark:ring-[#1C1635]" />
          )}
        </button>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : statusMsg.type === 'info'
              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
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

      {/* ========================================================
          2. USER PROFILE CARD (Top Elevated Card)
         ======================================================== */}
      <div
        onClick={() => setActiveModal('profile')}
        role="button"
        tabIndex={0}
        className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/10 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-500/30 transition-all active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3.5">
          {/* Avatar with Vibrant Purple Circle */}
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#6C47FF] to-[#A855F7] text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-purple-600/30 flex-shrink-0">
            {userInitial}
          </div>

          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
              {userNameVal || 'Raj Kumar'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {user?.email || 'raj@example.com'}
            </p>
            <div>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Check size={11} strokeWidth={3} />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span>Unverified · Tap to check</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronRight size={19} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* ========================================================
          3. GROUP 1: MANAGE FINANCES
         ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6C47FF] dark:text-[#C084FC] uppercase tracking-wider px-1">
          <Sliders size={14} />
          <span>Manage Finances</span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/10 shadow-xs divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
          {/* Monthly Budget Row */}
          <button
            type="button"
            onClick={() => setActiveModal('budget')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Target size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Monthly Budget
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Set or update your monthly budget ({formatCurrency(parseFloat(budgetVal) || 0)})
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Categories Row */}
          <button
            type="button"
            onClick={() => setActiveModal('categories')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Tag size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Categories
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Manage expense categories ({categories.length} active)
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ========================================================
          4. GROUP 2: PERSONALIZATION
         ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6C47FF] dark:text-[#C084FC] uppercase tracking-wider px-1">
          <Palette size={14} />
          <span>Personalization</span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/10 shadow-xs overflow-hidden">
          {/* Appearance & Theme Row */}
          <button
            type="button"
            onClick={() => setActiveModal('theme')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Moon size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Appearance &amp; Theme
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  Choose a theme ({theme})
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ========================================================
          5. GROUP 3: DATA MANAGEMENT
         ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6C47FF] dark:text-[#C084FC] uppercase tracking-wider">
            <ArrowLeftRight size={14} />
            <span>Data Management</span>
          </div>

          {onOpenImportHistory && (
            <button
              type="button"
              onClick={onOpenImportHistory}
              className="text-[11px] font-semibold text-[#6C47FF] dark:text-[#C084FC] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <History size={12} />
              <span>Import History</span>
            </button>
          )}
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/10 shadow-xs divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
          {/* Import Transactions Row */}
          <button
            type="button"
            onClick={onOpenImport}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Upload size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors flex items-center gap-2">
                  <span>Import Transactions</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#6C47FF]/10 text-[#6C47FF] dark:text-[#C084FC]">
                    NEW
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Add expenses from Excel, CSV or bank statement
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Export Transactions Row */}
          <button
            type="button"
            onClick={() => setActiveModal('export')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Download size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Export Transactions
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Download your expense data (Excel / CSV)
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ========================================================
          6. GROUP 4: ACCOUNT & SUPPORT
         ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6C47FF] dark:text-[#C084FC] uppercase tracking-wider px-1">
          <Shield size={14} />
          <span>Account &amp; Support</span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/10 shadow-xs divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
          {/* Security Row */}
          <button
            type="button"
            onClick={() => setActiveModal('security')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Shield size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Security
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Password, email and account security
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Help & Support Row */}
          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <HelpCircle size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Help &amp; Support
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Get help, FAQs and contact support
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Privacy Policy Row */}
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  Privacy Policy
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  How we handle your data
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* About Row */}
          <button
            type="button"
            onClick={onOpenReleaseNotes}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Info size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                  About
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  App version, release notes and more
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-MODAL 1: MONTHLY BUDGET DIALOG
         ======================================================== */}
      {activeModal === 'budget' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Target Budget</h3>
                  <p className="text-xs text-slate-400">Set your spending ceiling for {selectedMonth || 'this month'}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Monthly Budget Amount ({currencyVal})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-[#6C47FF] dark:text-[#C084FC]">
                    {currencyVal}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    placeholder="12000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-extrabold text-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[10000, 15000, 20000, 25000, 30000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBudgetVal(String(amt))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] transition-all cursor-pointer"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <RefreshCw size={13} className="animate-spin" />}
                  <span>Save Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 2: CATEGORIES MANAGER DIALOG
         ======================================================== */}
      {activeModal === 'categories' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-5 max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Expense Categories</h3>
                  <p className="text-xs text-slate-400">Organize and customize categories for tracking</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Existing Categories List */}
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div key={c.id || c.name} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: c.color || '#6C47FF' }}>
                        <CategoryIcon name={c.icon || 'Tag'} size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                    </div>
                    {!c.is_system && (
                      <button
                        onClick={() => onDeleteCategory(c.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleCreateCategory} className="p-4 rounded-2xl border border-dashed border-purple-300 dark:border-purple-800/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Add New Category</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18132F] focus:outline-none focus:border-[#6C47FF]"
                  />
                  <button
                    type="submit"
                    disabled={!newCatName.trim()}
                    className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5835E5] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Color Selector */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {colorOptions.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewCatColor(hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${newCatColor === hex ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 3: APPEARANCE & THEME DIALOG
         ======================================================== */}
      {activeModal === 'theme' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <Moon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance &amp; Theme</h3>
                  <p className="text-xs text-slate-400">Choose your preferred visual presentation</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setTheme('light'); showToast('Switched to Light Theme', 'info'); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                  theme === 'light'
                    ? 'border-[#6C47FF] bg-purple-50/50 dark:bg-purple-900/20 shadow-md ring-2 ring-[#6C47FF]/20'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun size={18} />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-[11px] text-slate-400">Crisp white aesthetic</div>
              </button>

              <button
                type="button"
                onClick={() => { setTheme('dark'); showToast('Switched to Dark Theme', 'info'); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                  theme === 'dark'
                    ? 'border-[#6C47FF] bg-purple-50/50 dark:bg-purple-900/20 shadow-md ring-2 ring-[#6C47FF]/20'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#281D4C] text-[#C084FC] flex items-center justify-center">
                  <Moon size={18} />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Dark Violet</div>
                <div className="text-[11px] text-slate-400">Deep violet Android palette</div>
              </button>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 4: EXPORT TRANSACTIONS & DATA BACKUP DIALOG
         ======================================================== */}
      {activeModal === 'export' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Export &amp; Sovereign Data</h3>
                  <p className="text-xs text-slate-400">Download your personal financial records</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Excel Export Button */}
              <button
                type="button"
                onClick={handleExcelExport}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#6C47FF] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC]">
                      Excel Spreadsheet (.xlsx)
                    </div>
                    <div className="text-[11px] text-slate-400">Formatted workbook with summaries</div>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-[#6C47FF]" />
              </button>

              {/* JSON Data Backup */}
              <button
                type="button"
                onClick={handleJsonExport}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#6C47FF] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Database size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC]">
                      Full JSON Data Backup
                    </div>
                    <div className="text-[11px] text-slate-400">Transactions &amp; user categories</div>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-[#6C47FF]" />
              </button>

              {/* Import History */}
              {onOpenImportHistory && (
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); onOpenImportHistory(); }}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#6C47FF] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center">
                      <History size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC]">
                        Import History &amp; 1-Click Safe Undo
                      </div>
                      <div className="text-[11px] text-slate-400">View previous imports and revert batches</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#6C47FF]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 5: SECURITY & ACCOUNT DIALOG
         ======================================================== */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Security &amp; Account</h3>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Authentication Method</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.isGoogleUser ? 'Google OAuth 2.0 (Single Sign-On)' : 'Firebase Email & Password Auth'}
                </div>
              </div>

              {!user?.isGoogleUser && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resetPassword(user?.email);
                      showToast('Password reset link sent to your email!', 'success');
                    } catch (err) {
                      showToast(err.message || 'Could not send reset email', 'error');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key size={14} />
                  <span>Send Password Reset Email</span>
                </button>
              )}

              {!isEmailVerified && !user?.isGoogleUser && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resendVerificationEmail();
                      showToast('Verification email resent!', 'success');
                    } catch (err) {
                      showToast(err.message || 'Could not resend email', 'error');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Resend Email Verification Link</span>
                </button>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); if (onLogout) onLogout(); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 6: HELP & SUPPORT DIALOG
         ======================================================== */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Help &amp; Support</h3>
                  <p className="text-xs text-slate-400">Guides, tours and contact support</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => { setActiveModal(null); if (onOpenTour) onOpenTour(); }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#6C47FF] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC]">
                      Restart Guided Tour
                    </div>
                    <div className="text-[11px] text-slate-400">Review 3-step app onboarding tour</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-[#6C47FF]" />
              </button>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">Contact Developer &amp; Support</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Email: <a href="mailto:raaajshinde@gmail.com" className="text-[#6C47FF] dark:text-[#C084FC] underline">raaajshinde@gmail.com</a>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-2">
                  Open Source GitHub: <a href="https://github.com/Alwaysrajshinde/Expense-Tracker" target="_blank" rel="noreferrer" className="text-[#6C47FF] dark:text-[#C084FC] underline">Repository</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL 7: PROFILE EDIT DIALOG
         ======================================================== */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">User Profile</h3>
                  <p className="text-xs text-slate-400">Display name &amp; currency preferences</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={userNameVal}
                  onChange={(e) => setUserNameVal(e.target.value)}
                  placeholder="Raj Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currencyVal}
                  onChange={(e) => setCurrencyVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
                >
                  <option value="₹">₹ Indian Rupee (INR)</option>
                  <option value="$">$ US Dollar (USD)</option>
                  <option value="€">€ Euro (EUR)</option>
                  <option value="£">£ British Pound (GBP)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <RefreshCw size={13} className="animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Legal Modal (Privacy Policy & Terms) */}
      <LegalModal
        isOpen={Boolean(legalModalType)}
        initialTab={legalModalType || 'privacy'}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
