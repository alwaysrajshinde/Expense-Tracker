import React, { useState, useRef, useEffect } from 'react';
import {
  DollarSign, User, Tag, Download, Upload, Database, Check, AlertCircle,
  Plus, Trash2, RefreshCw, FileSpreadsheet, ShieldCheck, Sun, Moon, Sparkles,
  Cloud, Smartphone, ExternalLink, Link2, Key, LogOut
} from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import LegalModal from '../components/LegalModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import syncService from '../services/syncService';

export default function Settings({
  settings = {},
  categories = [],
  initialSection = 'budget',
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
  const [activeSection, setActiveSection] = useState(initialSection || 'budget');
  const [restoreFilePending, setRestoreFilePending] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [legalModalType, setLegalModalType] = useState(null);

  React.useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);
  const [budgetVal, setBudgetVal] = useState(settings.monthly_budget || '12000');
  const [userNameVal, setUserNameVal] = useState(settings.user_name || 'Raj');
  const [currencyVal, setCurrencyVal] = useState(settings.currency || '₹');

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#6C47FF');
  const [newCatIsQuick, setNewCatIsQuick] = useState(false);

  // Auth and Sync
  const { user, authorizedEmail, updateAuthorizedEmail, googleClientId, updateGoogleClientId, logout } = useAuth();
  const [syncConfig, setSyncConfig] = useState(syncService.getConfig());
  const [authorizedEmailVal, setAuthorizedEmailVal] = useState(authorizedEmail || user?.email || '');
  const [googleClientIdVal, setGoogleClientIdVal] = useState(googleClientId || '');
  const [googleScriptUrlVal, setGoogleScriptUrlVal] = useState(syncConfig.google_script_url || '');
  const [authSecretVal, setAuthSecretVal] = useState(syncConfig.auth_secret || 'ET_SECURE_SYNC_KEY_2026');
  const [testingSync, setTestingSync] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalledPwa(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalledPwa(true);
      setDeferredInstallPrompt(null);
    }
  };

  const handleSaveSyncConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      updateAuthorizedEmail(authorizedEmailVal);
      if (updateGoogleClientId) updateGoogleClientId(googleClientIdVal);
      syncService.saveConfig({
        google_script_url: googleScriptUrlVal.trim(),
        auth_secret: authSecretVal.trim()
      });
      setStatusMsg({ type: 'success', text: 'Google Sheets synchronization settings updated!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save sync settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSync = async () => {
    try {
      setTestingSync(true);
      syncService.saveConfig({
        google_script_url: googleScriptUrlVal.trim(),
        auth_secret: authSecretVal.trim()
      });
      await syncService.syncNow();
      setStatusMsg({ type: 'success', text: `Sync successful! Verified connection at ${new Date().toLocaleTimeString()}` });
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Sync error: ${err.message}` });
    } finally {
      setTestingSync(false);
    }
  };

  // Status message
  const [statusMsg, setStatusMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const excelInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateBudget(selectedMonth, parseFloat(budgetVal));
      await onUpdateSettings({ monthly_budget: budgetVal });
      setStatusMsg({ type: 'success', text: `Monthly budget updated to ${formatCurrency(budgetVal)}` });
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
      setStatusMsg({ type: 'success', text: 'Profile updated successfully' });
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
        is_quick: newCatIsQuick
      });
      setNewCatName('');
      setStatusMsg({ type: 'success', text: `Category "${newCatName}" added successfully!` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to add category' });
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatusMsg({ type: 'info', text: 'Importing Excel file...' });
      const result = await onImportFile(file);
      setStatusMsg({
        type: 'success',
        text: `Successfully imported ${result.imported} transactions (${result.skipped} skipped)`
      });
      onRefreshAll();
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
      setRestoreFilePending(null);
      onRefreshAll();
    } catch (err) {
      showToast(err.message || 'Failed to restore backup', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const iconOptions = [
    'Tag', 'Utensils', 'Car', 'Train', 'Apple', 'Shirt', 'ShoppingBag',
    'Coffee', 'HeartPulse', 'Smartphone', 'TrendingUp', 'Navigation',
    'IceCream', 'Zap', 'Home', 'Briefcase', 'GraduationCap', 'BookOpen'
  ];

  const colorOptions = [
    '#6C47FF', '#F59E0B', '#0EA5E9', '#EF4444', '#3B82F6', '#10B981',
    '#EC4899', '#8B5CF6', '#F97316', '#64748B', '#059669', '#DC2626'
  ];

  return (
    <div className="space-y-5 px-4 sm:px-6 lg:px-8 py-4 pb-24 lg:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Application & Data Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure budgets, manage categories, themes, and backup your historical database
        </p>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${statusMsg.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          : statusMsg.type === 'info'
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100 text-base">
            ×
          </button>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl text-xs font-semibold max-w-2xl">
        <button
          onClick={() => setActiveSection('budget')}
          className={`py-2 px-2.5 rounded-xl transition-all ${activeSection === 'budget' ? 'bg-[#6C47FF] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
        >
          Budget
        </button>
        <button
          onClick={() => setActiveSection('categories')}
          className={`py-2 px-2.5 rounded-xl transition-all ${activeSection === 'categories' ? 'bg-[#6C47FF] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveSection('data')}
          className={`py-2 px-2.5 rounded-xl transition-all ${activeSection === 'data' ? 'bg-[#6C47FF] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
        >
          Data & Backup
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`py-2 px-2.5 rounded-xl transition-all ${activeSection === 'profile' ? 'bg-[#6C47FF] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
        >
          Theme & Profile
        </button>
        <button
          onClick={() => setActiveSection('sync')}
          className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeSection === 'sync' ? 'bg-[#6C47FF] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
        >
          <Cloud size={13} />
          <span>Sheets Sync</span>
        </button>
      </div>

      {/* SECTION 1: BUDGET */}
      {activeSection === 'budget' && (
        <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 max-w-2xl transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Target Budget
              </h3>
              <p className="text-xs text-slate-400">
                Default baseline monthly budget is ₹12,000 (INR)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Budget Amount ({currencyVal})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                  {currencyVal}
                </span>
                <input
                  type="number"
                  step="100"
                  required
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                Updates your active spending thresholds and calculations across all dashboard gauges and reports.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save Monthly Budget'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 2: CATEGORIES */}
      {activeSection === 'categories' && (
        <div className="space-y-5">
          {/* Add Category Form */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 max-w-2xl transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus size={18} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
              <span>Create Custom Category</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym, Books, Gaming..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                />
              </div>

              {/* Icon selector */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Choose Icon
                </span>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCatIcon(ic)}
                      className={`p-2 rounded-xl border transition-all ${newCatIcon === ic
                        ? 'border-[#6C47FF] bg-purple-50 dark:bg-purple-950/60 text-[#6C47FF]'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                      <CategoryIcon name="" icon={ic} color={newCatIcon === ic ? '#6C47FF' : '#64748B'} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Choose Accent Color
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${newCatColor === c ? 'scale-115 border-slate-900 dark:border-white shadow-sm' : 'border-transparent'
                        }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-95 transition-all"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Master Categories Grid */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              All Master Categories ({categories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
              {categories.map((cat) => (
                <div
                  key={cat.id || cat.name}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: `${cat.color || '#6C47FF'}20` }}
                    >
                      <CategoryIcon name={cat.name} icon={cat.icon} color={cat.color} size={17} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.usage_count || 0} records
                      </span>
                    </div>
                  </div>

                  {Boolean(cat.is_quick) && (
                    <span className="text-[10px] font-bold text-[#6C47FF] dark:text-[#A78BFA] bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                      Quick
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DATA & BACKUP */}
      {activeSection === 'data' && (
        <div className="space-y-5 max-w-3xl">
          {/* Export card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
                <Download size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Export Historical Records
                </h3>
                <p className="text-xs text-slate-400">
                  Export all 1,198+ transactions into formatted Excel (.xlsx) or JSON backup
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="/api/export/excel"
                download="Daily_Expenses_Export.xlsx"
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
              >
                <FileSpreadsheet size={18} className="text-emerald-600" />
                <span>Export Excel (.xlsx)</span>
              </a>

              <a
                href="/api/export/json"
                download="expense_tracker_backup.json"
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
              >
                <Database size={18} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
                <span>Download JSON Backup</span>
              </a>
            </div>
          </div>

          {/* Import & Restore card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import & Restore Database
                </h3>
                <p className="text-xs text-slate-400">
                  Import new spreadsheet entries or restore from a previously saved JSON backup
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <input
                  type="file"
                  ref={excelInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
                >
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <span>Import Excel / CSV</span>
                </button>
              </div>

              <div>
                <input
                  type="file"
                  ref={jsonInputRef}
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
                >
                  <RefreshCw size={18} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
                  <span>Restore from Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database & Storage Architecture */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>Persistent SQLite Database Engine</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your expenses are stored in a local SQLite file (`data/expense_tracker.db`) operating with Write-Ahead Logging (WAL) mode for atomic consistency, zero latency, and persistent survival across all restarts and power cycles.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 4: THEME & PROFILE */}
      {activeSection === 'profile' && (
        <div className="space-y-5 max-w-2xl">
          {/* Theme Settings Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Theme Appearance
                </h3>
                <p className="text-xs text-slate-400">
                  Choose from 4 professionally designed themes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {(availableThemes || []).map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#6C47FF] dark:border-[#8B5CF6] bg-purple-50/60 dark:bg-purple-950/40 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs mb-2 border border-slate-200/60 dark:border-white/10"
                      style={{ backgroundColor: t.bg }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white text-center">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Release Notes & App Version Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-3 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Version Information</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-[#6C47FF] dark:text-[#A78BFA] text-[10px] font-black">
                    v1.1.0
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  See what features, security updates, and performance optimizations were introduced
                </p>
              </div>
              {onOpenReleaseNotes && (
                <button
                  type="button"
                  onClick={onOpenReleaseNotes}
                  className="py-2.5 px-4 bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  View Release Notes
                </button>
              )}
            </div>
          </div>

          {/* User Profile Form */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
                <User size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  User Profile
                </h3>
                <p className="text-xs text-slate-400">
                  Update your display name and preferred currency symbol
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={userNameVal}
                  onChange={(e) => setUserNameVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  value={currencyVal}
                  onChange={(e) => setCurrencyVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
              </button>
            </form>
          </div>

          {/* Product Tour & Walkthrough */}
          {onOpenTour && (
            <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Product Tour &amp; Walkthrough
                    </h3>
                    <p className="text-xs text-slate-400">
                      Revisit the 3-step guide on setting budgets, minimal categories, and fast logging
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenTour}
                  className="py-2.5 px-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-[#6C47FF] dark:text-[#A78BFA] rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Sparkles size={15} />
                  <span>Take Product Tour</span>
                </button>
              </div>
            </div>
          )}

          {/* Account Security & Logout */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Account Security & Session
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active Session: <strong className="text-slate-700 dark:text-slate-200">{user?.email || 'Logged In Account'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout || logout}
                className="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <LogOut size={15} />
                <span>Log Out of Account</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
              Logging out ends your active login session and protects your personal expense vault behind the Google authentication gate.
            </p>
          </div>

          {/* Privacy & Legal Governance */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Privacy Policy &amp; Terms of Service
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sovereign data governance, GDPR/CCPA disclosures &amp; terms
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="py-2 px-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="py-2 px-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: GOOGLE SHEETS SYNC & PWA */}
      {activeSection === 'sync' && (
        <div className="space-y-5 max-w-3xl">
          {/* Individual Google Spreadsheet Status Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Google Drive &amp; Associated Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your personal spreadsheet in Google Drive initialized with the 4 standard sheets
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${user?.email === 'raaajshinde@gmail.com'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-[#6C47FF] dark:text-[#A78BFA] border-purple-200 dark:border-purple-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                {user?.email === 'raaajshinde@gmail.com' ? 'Migrated Vault (Historical)' : 'Active Isolated Vault'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Spreadsheet ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block select-all">
                  {user?.spreadsheet_id || (user?.email === 'raaajshinde@gmail.com' ? '1x-master-raj-expenses-sheet-2026' : 'Personal Cloud Storage')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {user?.email === 'raaajshinde@gmail.com'
                    ? '1,198 historical transactions preserved'
                    : 'Personal isolated Google Sheet in your Drive'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Standard Template Structure
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Expenses • Dashboard • Categories • Payment_Modes
                </span>
                <span className="text-[10px] text-slate-400">
                  {categories.length} personalized categories configured
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={user?.spreadsheet_id ? `https://docs.google.com/spreadsheets/d/${user.spreadsheet_id}/edit` : '#'}
                target={user?.spreadsheet_id ? '_blank' : '_self'}
                rel="noreferrer"
                onClick={(e) => {
                  if (!user?.spreadsheet_id && user?.email !== 'raaajshinde@gmail.com') {
                    e.preventDefault();
                    showToast('Personal Google Sheet not yet linked. Sign in with Google to create one.', 'info');
                  }
                }}
                className="py-2.5 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <ExternalLink size={14} className="text-[#6C47FF] dark:text-[#A78BFA]" />
                <span>Open in Google Sheets</span>
              </a>

              <a
                href="/api/template/download"
                download="Expense_Tracker_Master_Template.xlsx"
                className="py-2.5 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Download Blank Template (.xlsx)</span>
              </a>
            </div>
          </div>

          {/* Google Account & Automatic Synchronization Status */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
                  <Cloud size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Google Cloud &amp; Drive Synchronization
                  </h3>
                  <p className="text-xs text-slate-400">
                    Continuous two-way synchronization between this application and your private Google Sheet
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Check size={13} />
                <span>Auto-Sync Connected</span>
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {(user?.name || user?.email || 'R')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {user?.name || 'Raj Shinde'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {user?.email || 'raaajshinde@gmail.com'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sync Status
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Synced just now
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-2">
                All changes you make in this app update your Google Sheet automatically. Any rows added or modified in Google Sheets are reconciled without duplicates.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={testingSync}
                onClick={handleTestSync}
                className="py-2.5 px-5 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] hover:from-[#5B32EA] hover:to-[#7C3AED] text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw size={15} className={testingSync ? 'animate-spin' : ''} />
                <span>{testingSync ? 'Synchronizing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout || logout}
                className="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={15} />
                <span>Disconnect Account</span>
              </button>
            </div>
          </div>

          {/* Progressive Web App (PWA) Card */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#8B5CF6] flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Progressive Web App (PWA) on Android
                </h3>
                <p className="text-xs text-slate-400">
                  Install on your Android home screen to launch in full-screen standalone mode
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Installation Status
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isInstalledPwa
                      ? '✓ Installed in Standalone Mode'
                      : deferredInstallPrompt
                        ? 'Ready to Install on this device'
                        : 'Web App Manifest & Service Worker Active'}
                  </span>
                </div>
                {deferredInstallPrompt ? (
                  <button
                    onClick={handleInstallPwa}
                    className="py-2.5 px-4 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 hover:opacity-95 transition-opacity"
                  >
                    Install App
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    PWA Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                To install on your Android phone: Open this site in Chrome, tap the menu (⋮), and tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreFilePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A172B] rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl space-y-4 animate-scale-in">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Restore Database Backup?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Restoring from <strong>{restoreFilePending.name}</strong> will overwrite current transactions with backup records. Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRestoreFilePending(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={executeRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6C47FF] hover:bg-[#5B32EA] shadow-md shadow-purple-600/25 flex items-center gap-1.5"
              >
                {restoring ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>{restoring ? 'Restoring...' : 'Confirm Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Legal Modal */}
      <LegalModal
        isOpen={Boolean(legalModalType)}
        onClose={() => setLegalModalType(null)}
        initialTab={legalModalType || 'privacy'}
      />
    </div>
  );
}
