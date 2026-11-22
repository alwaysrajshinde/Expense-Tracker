import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, FileSpreadsheet,
  Calendar, Layers, ShieldCheck, Check, Sparkles, ArrowRight, WifiOff, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  requestGoogleSheetsAccess,
  getCachedToken,
  getSavedSheetConfig,
  executeGoogleSheetsExport,
  filterTransactionsForExport
} from '../../services/googleSheetsService';

export default function GoogleSheetsExportModal({
  isOpen,
  onClose,
  transactions = [],
  selectedMonth = new Date().toISOString().slice(0, 7),
  availableMonths = [],
  formatCurrency
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [exportScope, setExportScope] = useState('all'); // 'all' | 'current_month' | 'selected_month' | 'date_range'
  const [targetMonth, setTargetMonth] = useState(selectedMonth || new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [destination, setDestination] = useState('create_new'); // 'create_new' | 'update_existing'
  const [existingConfig, setExistingConfig] = useState(null);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [errorMsg, setErrorMsg] = useState(null);
  const [exportResult, setExportResult] = useState(null);

  // Dynamic network connectivity listener
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state upon opening
  useEffect(() => {
    if (isOpen && user) {
      const uid = user.uid || user.id || 'default_user';
      const hasToken = Boolean(getCachedToken(uid));
      setIsAuthorized(hasToken);

      const saved = getSavedSheetConfig(uid);
      if (saved && saved.spreadsheetId) {
        setExistingConfig(saved);
        setDestination('update_existing');
      } else {
        setExistingConfig(null);
        setDestination('create_new');
      }

      setErrorMsg(null);
      setExportResult(null);
      setProgressPercent(0);
      setProgressMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentFilteredCount = filterTransactionsForExport(transactions, exportScope, {
    selectedMonth: targetMonth,
    startDate,
    endDate
  }).length;

  const handleAuthorize = async () => {
    if (!isOnline) {
      showToast('Internet required to authorize Google Sheets', 'error');
      return;
    }
    try {
      setAuthorizing(true);
      setErrorMsg(null);
      const uid = user?.uid || user?.id || 'default_user';
      await requestGoogleSheetsAccess(uid, user?.email);
      setIsAuthorized(true);
      showToast('Google Sheets authorization successful!', 'success');
    } catch (err) {
      console.error('[GoogleSheetsExportModal] Auth error:', err);
      setErrorMsg(err.message || 'Failed to authorize Google Sheets access');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleExecuteExport = async () => {
    if (!isOnline) {
      setErrorMsg('Cannot export to Google Sheets while offline. Please connect to the internet.');
      return;
    }

    if (currentFilteredCount === 0) {
      setErrorMsg('No transactions match the selected criteria.');
      return;
    }

    try {
      setExporting(true);
      setErrorMsg(null);
      setExportResult(null);
      setProgressPercent(5);
      setProgressMsg('Starting export workflow...');

      const uid = user?.uid || user?.id || 'default_user';
      const userName = user?.name || user?.displayName || 'Raj Shinde';

      const result = await executeGoogleSheetsExport({
        userId: uid,
        userEmail: user?.email,
        userName,
        transactions,
        exportScope,
        filterOptions: {
          selectedMonth: targetMonth,
          startDate,
          endDate
        },
        destination,
        existingSpreadsheetId: destination === 'update_existing' ? existingConfig?.spreadsheetId : null,
        onProgress: (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        }
      });

      setExportResult(result);
      setIsAuthorized(true);
      setExistingConfig({
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        title: result.title,
        lastExportedAt: new Date().toISOString(),
        lastExportCount: result.count
      });
      showToast(`Successfully exported ${result.count} transactions to Google Sheets!`, 'success');
    } catch (err) {
      console.error('[GoogleSheetsExportModal] Export failed:', err);
      setErrorMsg(err.message || 'Export failed. Please verify your connection and permissions.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={() => !exporting && onClose()} />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#18132F] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl z-10 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Export to Google Sheets</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Cloud Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">Directly sync financial records to your Google Drive</p>
            </div>
          </div>

          <button
            onClick={() => !exporting && onClose()}
            disabled={exporting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5">
            <WifiOff size={16} className="flex-shrink-0" />
            <div>
              <span className="font-bold">Offline:</span> Google Sheets export requires an active internet connection. Please reconnect to export.
            </div>
          </div>
        )}

        {/* Account & OAuth Status Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C47FF] to-[#A855F7] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Raj Shinde'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          </div>

          {isAuthorized ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">
              <Check size={11} strokeWidth={3} />
              <span>Sheets Authorized</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAuthorize}
              disabled={authorizing || !isOnline}
              className="px-3 py-1.5 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {authorizing ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              <span>Authorize Access</span>
            </button>
          )}
        </div>

        {/* Export Scope Filter Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            1. Select Export Scope
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'all', label: 'All Transactions', desc: 'Complete historical vault' },
              { id: 'current_month', label: 'Current Month', desc: selectedMonth || 'Active view' },
              { id: 'selected_month', label: 'Specific Month', desc: 'Choose month & year' },
              { id: 'date_range', label: 'Custom Date Range', desc: 'Pick start & end date' }
            ].map(opt => {
              const isSelected = exportScope === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExportScope(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#6C47FF] bg-purple-500/10 dark:bg-purple-900/30 ring-2 ring-[#6C47FF]/20 shadow-xs'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#6C47FF]" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Sub-Filters for Specific Month or Custom Range */}
          {exportScope === 'selected_month' && (
            <div className="pt-2 animate-fade-in">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Choose Month
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {exportScope === 'date_range' && (
            <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#6C47FF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Destination Option: Create New vs Update Existing */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            2. Google Drive Destination
          </label>

          <div className="space-y-2">
            {existingConfig?.spreadsheetId && (
              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                destination === 'update_existing'
                  ? 'border-[#6C47FF] bg-purple-500/10 dark:bg-purple-900/30'
                  : 'border-slate-200 dark:border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="dest"
                    checked={destination === 'update_existing'}
                    onChange={() => setDestination('update_existing')}
                    className="accent-[#6C47FF]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Update Connected Spreadsheet
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[260px]">
                      {existingConfig.title || 'Expense Tracker Spreadsheet'}
                    </div>
                  </div>
                </div>

                <a
                  href={existingConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C47FF] transition-colors"
                  title="Open existing sheet"
                >
                  <ExternalLink size={14} />
                </a>
              </label>
            )}

            <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              destination === 'create_new'
                ? 'border-[#6C47FF] bg-purple-500/10 dark:bg-purple-900/30'
                : 'border-slate-200 dark:border-white/10'
            }`}>
              <input
                type="radio"
                name="dest"
                checked={destination === 'create_new'}
                onChange={() => setDestination('create_new')}
                className="accent-[#6C47FF]"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Create Brand New Spreadsheet
                </div>
                <div className="text-[11px] text-slate-400">
                  Initializes a formatted workbook with Transactions &amp; Monthly Summary
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Live Progress Bar when Exporting */}
        {exporting && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-[#6C47FF] dark:text-[#C084FC]">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin" />
                <span>{progressMsg || 'Exporting to Google Sheets...'}</span>
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-purple-200 dark:bg-purple-950/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6C47FF] to-[#A855F7] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert & Open Action */}
        {exportResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Export Successful! {exportResult.count} records written to Google Sheets.</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Your spreadsheet is ready in Google Drive with clean formatting, formulas, and monthly breakdown.
            </div>
            <a
              href={exportResult.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Selected: <span className="font-bold text-slate-900 dark:text-white">{currentFilteredCount}</span> transactions
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-30"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={exporting || currentFilteredCount === 0 || !isOnline}
              className="px-6 py-2 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {exporting && <RefreshCw size={13} className="animate-spin" />}
              <span>{exporting ? 'Exporting...' : 'Export Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
