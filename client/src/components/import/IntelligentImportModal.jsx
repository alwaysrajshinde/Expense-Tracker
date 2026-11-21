import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Clipboard, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Filter, 
  Trash2, 
  Layers, 
  HelpCircle,
  Eye,
  Check,
  Download,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { parseFile, parsePastedText } from '../../services/import/fileParser';
import { autoDetectColumnMapping, saveMappingTemplate, getSavedMappingTemplate } from '../../services/import/columnMapper';
import { detectBankSignature, reconcileStatementArithmetic, SUPPORTED_BANKS } from '../../services/import/bankStatementDetector';
import { detectDuplicates } from '../../services/import/duplicateDetector';
import { transformRowsToCandidates, executeImport, undoImportBatch } from '../../services/import/importService';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

export default function IntelligentImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete,
  userCategories = [],
  formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
}) {
  const { user } = useAuth();
  const userId = user?.uid || user?.id || 'guest';

  // Steps: 1: source, 2: upload, 3: mapping, 4: preview, 5: duplicates, 6: confirm, 7: result
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Configuration
  const [importSource, setImportSource] = useState('excel'); // 'excel' | 'bank' | 'paste'
  const [selectedBankId, setSelectedBankId] = useState('generic');
  const [accountNickname, setAccountNickname] = useState('');

  // Step 2: Raw parsed data
  const [fileObject, setFileObject] = useState(null);
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Step 3: Column Mapping
  const [columnMapping, setColumnMapping] = useState({});
  const [amountMode, setAmountMode] = useState('single_amount'); // 'single_amount' | 'debit_credit'
  const [detectedBank, setDetectedBank] = useState(null);

  // Step 4 & 5: Candidates & Duplicate Detection
  const [candidates, setCandidates] = useState([]);
  const [existingTransactions, setExistingTransactions] = useState([]);
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all' | 'ready' | 'duplicates' | 'transfers' | 'refunds'
  const [searchQuery, setSearchQuery] = useState('');

  // Step 6 & 7: Execution & Results
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [undoStatus, setUndoStatus] = useState(null);

  // Load existing transactions for duplicate detection
  useEffect(() => {
    if (isOpen) {
      api.getTransactions({ limit: 2000 }).then(res => {
        setExistingTransactions(res.transactions || []);
      }).catch(err => console.warn('Could not load transactions for duplicate check:', err));
    }
  }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setParsedData(null);
      setFileObject(null);
      setRawText('');
      setParseError('');
      setCandidates([]);
      setImportResult(null);
      setUndoStatus(null);
    }
  }, [isOpen]);

  // ========================================================
  // STEP 2: FILE UPLOAD & PARSING HANDLER
  // ========================================================
  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileObject(file);
    setIsParsing(true);
    setParseError('');

    try {
      const data = await parseFile(file, selectedSheet);
      setParsedData(data);
      if (data.sheets && data.sheets.length > 0 && !selectedSheet) {
        setSelectedSheet(data.sheets[0]);
      }
      runAutoDetection(data, file.name);
      setCurrentStep(3); // Proceed to column mapping
    } catch (err) {
      setParseError(err.message || 'Failed to read file. Please verify format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSheetChange = async (newSheet) => {
    setSelectedSheet(newSheet);
    if (!fileObject) return;
    setIsParsing(true);
    try {
      const data = await parseFile(fileObject, newSheet);
      setParsedData(data);
      runAutoDetection(data, fileObject.name);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim()) {
      setParseError('Please paste your transaction rows.');
      return;
    }
    setIsParsing(true);
    setParseError('');
    try {
      const data = parsePastedText(rawText);
      setParsedData(data);
      runAutoDetection(data, 'Pasted Data');
      setCurrentStep(3);
    } catch (err) {
      setParseError(err.message || 'Could not parse pasted text.');
    } finally {
      setIsParsing(false);
    }
  };

  // Run auto-detection of bank and column mapping
  const runAutoDetection = (data, sourceName) => {
    // 1. Detect Bank Signature
    const bankSignature = detectBankSignature(sourceName, data.headers, data.sampleRows);
    setDetectedBank(bankSignature);
    if (bankSignature.id !== 'generic') {
      setSelectedBankId(bankSignature.id);
    }

    // 2. Check saved template first, then auto-detect
    const saved = getSavedMappingTemplate(bankSignature.id !== 'generic' ? bankSignature.id : sourceName);
    if (saved) {
      setColumnMapping(saved.mapping || {});
      setAmountMode(saved.amountMode || 'single_amount');
    } else if (bankSignature.suggestedMapping) {
      setColumnMapping(bankSignature.suggestedMapping);
      setAmountMode('debit_credit');
    } else {
      const detected = autoDetectColumnMapping(data.headers);
      setColumnMapping(detected.mapping);
      setAmountMode(detected.amountMode);
    }
  };

  // ========================================================
  // STEP 3: CONFIRM MAPPING & BUILD CANDIDATES
  // ========================================================
  const handleProceedToPreview = () => {
    if (!columnMapping.date) {
      setParseError('Please select which column contains the Date.');
      return;
    }
    if (amountMode === 'single_amount' && !columnMapping.amount) {
      setParseError('Please select which column contains the Amount.');
      return;
    }
    if (amountMode === 'debit_credit' && (!columnMapping.debit || !columnMapping.credit)) {
      setParseError('Please select both Debit and Credit columns.');
      return;
    }

    setParseError('');

    // Save mapping template for future convenience
    const templateKey = selectedBankId !== 'generic' ? selectedBankId : (fileObject?.name || 'custom_import');
    saveMappingTemplate(templateKey, { mapping: columnMapping, amountMode });

    // Transform raw rows into normalized candidate transactions
    const rawCandidates = transformRowsToCandidates(
      parsedData.rawRows,
      parsedData.headers,
      columnMapping,
      amountMode,
      detectedBank?.bank || 'Generic'
    );

    if (rawCandidates.length === 0) {
      setParseError('No valid transaction rows found with the selected columns. Please check your mapping.');
      return;
    }

    // Run duplicate detection against existing ledger
    const evaluated = detectDuplicates(rawCandidates, existingTransactions);
    setCandidates(evaluated);
    setCurrentStep(4); // Move to Preview & Classification step
  };

  // ========================================================
  // CANDIDATE EDITING & CLASSIFICATION HANDLERS
  // ========================================================
  const handleToggleSelect = (tempId) => {
    setCandidates(prev => prev.map(c => c.tempId === tempId ? { ...c, selected: !c.selected } : c));
  };

  const handleSelectAll = (select = true) => {
    setCandidates(prev => prev.map(c => ({ ...c, selected: select })));
  };

  const handleCandidateChange = (tempId, field, value) => {
    setCandidates(prev => prev.map(c => {
      if (c.tempId !== tempId) return c;
      const updated = { ...c, [field]: value };
      if (field === 'type') {
        updated.is_transfer = value === 'transfer';
        updated.is_refund = value === 'refund';
      }
      return updated;
    }));
  };

  // Filtered candidates for display
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (previewFilter === 'ready' && (!c.selected || c.duplicateStatus !== 'unique')) return false;
      if (previewFilter === 'duplicates' && c.duplicateStatus === 'unique') return false;
      if (previewFilter === 'transfers' && !c.is_transfer) return false;
      if (previewFilter === 'refunds' && !c.is_refund) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const amt = String(c.amount || '');
        return desc.includes(q) || cat.includes(q) || amt.includes(q);
      }
      return true;
    });
  }, [candidates, previewFilter, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const selected = candidates.filter(c => c.selected);
    const duplicates = candidates.filter(c => c.duplicateStatus !== 'unique');
    const transfers = selected.filter(c => c.is_transfer || c.type === 'transfer');
    const refunds = selected.filter(c => c.is_refund || c.type === 'refund');
    const expenses = selected.filter(c => !c.is_transfer && !c.is_refund && c.type !== 'income');
    const income = selected.filter(c => c.type === 'income');

    const totalExpense = expenses.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalIncome = income.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalRefund = refunds.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalTransfer = transfers.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    return {
      totalDetected: candidates.length,
      selectedCount: selected.length,
      duplicateCount: duplicates.length,
      transferCount: transfers.length,
      refundCount: refunds.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
      totalExpense: Math.round(totalExpense),
      totalIncome: Math.round(totalIncome),
      totalRefund: Math.round(totalRefund),
      totalTransfer: Math.round(totalTransfer)
    };
  }, [candidates]);

  // Arithmetical statement reconciliation
  const reconciliation = useMemo(() => {
    return reconcileStatementArithmetic(candidates);
  }, [candidates]);

  // ========================================================
  // STEP 6: EXECUTE IMPORT
  // ========================================================
  const handleExecuteImport = async () => {
    const approved = candidates.filter(c => c.selected);
    if (approved.length === 0) {
      setParseError('No transactions selected for import.');
      return;
    }

    setIsImporting(true);
    setImportProgress(20);

    try {
      const metadata = {
        filename: fileObject?.name || 'Pasted Data',
        source: importSource,
        bank_name: detectedBank?.bank || (SUPPORTED_BANKS.find(b => b.id === selectedBankId)?.name) || 'Generic',
        account_nickname: accountNickname || undefined,
        total_detected: candidates.length
      };

      setImportProgress(50);
      const result = await executeImport(userId, approved, metadata);
      setImportProgress(100);
      setImportResult(result);
      setCurrentStep(7); // Show Results Step

      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err) {
      setParseError(err.message || 'Import failed during database writes.');
    } finally {
      setIsImporting(false);
    }
  };

  // Undo current import
  const handleUndo = async () => {
    if (!importResult?.batchId) return;
    try {
      const res = await undoImportBatch(userId, importResult.batchId);
      setUndoStatus(`Successfully reverted ${res.deletedCount} imported transactions.`);
      if (onImportComplete) onImportComplete({ reverted: true });
    } catch (err) {
      setUndoStatus(`Failed to undo: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#16132A] rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-white/10 transition-colors animate-scale-in">
        
        {/* ========================================================
            TOP MODAL HEADER & STEP PROGRESS
            ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Intelligent Expense Import</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#6C47FF] dark:text-[#A78BFA]">
                  Step {currentStep} of 7
                </span>
              </h2>
              <p className="text-xs text-slate-400">Excel, CSV, Bank Statements &amp; Direct Paste</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Error Banner */}
        {parseError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{parseError}</span>
            </div>
            <button onClick={() => setParseError('')} className="hover:opacity-75"><X size={14} /></button>
          </div>
        )}

        {/* ========================================================
            MODAL BODY (DYNAMIC STEP ROUTING)
            ======================================================== */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 dark:text-slate-300">
          
          {/* STEP 1: SELECT IMPORT SOURCE & BANK */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Choose Import Source</h3>
                <p className="text-xs text-slate-400">Select how your financial transactions are stored</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setImportSource('excel')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    importSource === 'excel'
                      ? 'border-[#6C47FF] bg-purple-50/50 dark:bg-purple-900/20 shadow-md ring-2 ring-[#6C47FF]/20'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#6C47FF] flex items-center justify-center font-bold">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Excel / CSV Spreadsheet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Import records from <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> files with custom column detection.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportSource('bank')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    importSource === 'bank'
                      ? 'border-[#6C47FF] bg-purple-50/50 dark:bg-purple-900/20 shadow-md ring-2 ring-[#6C47FF]/20'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Bank Statement</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Statements from SBI, HDFC, ICICI, Axis, Kotak with smart UPI merchant cleaning.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportSource('paste')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    importSource === 'paste'
                      ? 'border-[#6C47FF] bg-purple-50/50 dark:bg-purple-900/20 shadow-md ring-2 ring-[#6C47FF]/20'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
                    <Clipboard size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Direct Clipboard Paste</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Copy and paste table cells directly from Excel, Google Sheets, or web banking portals.
                  </p>
                </button>
              </div>

              {/* Optional Bank Account Nickname */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#6C47FF]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Associate with Bank Account (Optional)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Bank Name</label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                    >
                      {SUPPORTED_BANKS.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Nickname (e.g. HDFC Salary - XX4092)</label>
                    <input
                      type="text"
                      placeholder="e.g. Salary Account"
                      value={accountNickname}
                      onChange={(e) => setAccountNickname(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD FILE OR PASTE TEXT */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {importSource === 'paste' ? 'Paste Transaction Table' : 'Upload Spreadsheet or Bank Statement'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {importSource === 'paste'
                      ? 'Copy rows from Excel or Sheets and paste them below'
                      : 'Drag and drop your .xlsx, .xls, or .csv document'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Change Source
                </button>
              </div>

              {importSource === 'paste' ? (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your copied rows here...&#10;Example:&#10;Date&#9;Description&#9;Amount&#9;Category&#10;2026-11-20&#9;Swiggy Delivery&#9;450&#9;Food & Dining"
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-xs font-mono focus:outline-none focus:border-[#6C47FF] resize-none"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Supports Tab-separated or Comma-separated rows</span>
                    <button
                      type="button"
                      disabled={isParsing || !rawText.trim()}
                      onClick={handlePasteSubmit}
                      className="px-5 py-2 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Analyze Pasted Data</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <label className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-[#6C47FF] dark:hover:border-[#A78BFA] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-white/[0.01]">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center mb-3 shadow-xs">
                      <Upload size={28} />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-white">
                      Click to choose file, or drag and drop
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Excel (.xlsx, .xls) or CSV (.csv, .txt) · Max 10MB
                    </span>
                  </label>

                  {isParsing && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#6C47FF] font-semibold py-2">
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Inspecting file and auto-detecting bank headers...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COLUMN MAPPING & BANK DETECTOR */}
          {currentStep === 3 && parsedData && (
            <div className="space-y-6">
              {/* Detected Bank Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6C47FF] text-white flex items-center justify-center font-bold text-sm">
                    {detectedBank?.id !== 'generic' ? <Building2 size={18} /> : <FileSpreadsheet size={18} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {detectedBank?.bank || 'Standard Spreadsheet Detected'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Found {parsedData.totalRows} data rows across {parsedData.headers.length} columns (Header row: #{parsedData.headerRowIndex + 1})
                    </span>
                  </div>
                </div>

                {/* Worksheet Selector if multiple */}
                {parsedData.sheets && parsedData.sheets.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#16132A] border border-slate-200 dark:border-white/10 font-bold text-[#6C47FF]"
                    >
                      {parsedData.sheets.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Mode Toggle: Single Amount vs Debit/Credit */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Map Spreadsheet Columns</h3>
                  <p className="text-xs text-slate-400">Verify that fields correctly match your document</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAmountMode('single_amount')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      amountMode === 'single_amount'
                        ? 'bg-[#6C47FF] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Single Amount Column
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountMode('debit_credit')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      amountMode === 'debit_credit'
                        ? 'bg-[#6C47FF] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Separate Debit &amp; Credit Columns
                  </button>
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date (Required) */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Transaction Date *</span>
                    <span className="text-[10px] text-[#6C47FF] font-semibold">Required</span>
                  </label>
                  <select
                    value={columnMapping.date || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Description (Optional) */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Narration / Description</span>
                    <span className="text-[10px] text-slate-400">Recommended</span>
                  </label>
                  <select
                    value={columnMapping.description || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Amount Fields based on Mode */}
                {amountMode === 'single_amount' ? (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Transaction Amount *</span>
                      <span className="text-[10px] text-[#6C47FF] font-semibold">Required</span>
                    </label>
                    <select
                      value={columnMapping.amount || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                    >
                      <option value="">-- Select Column --</option>
                      {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Debit / Withdrawal *</span>
                        <span className="text-[10px] text-rose-500 font-semibold">Money Out</span>
                      </label>
                      <select
                        value={columnMapping.debit || ''}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, debit: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                      >
                        <option value="">-- Select Column --</option>
                        {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Credit / Deposit *</span>
                        <span className="text-[10px] text-emerald-500 font-semibold">Money In</span>
                      </label>
                      <select
                        value={columnMapping.credit || ''}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, credit: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                      >
                        <option value="">-- Select Column --</option>
                        {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Reference / UTR Number */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Reference / UTR / Cheque</span>
                    <span className="text-[10px] text-slate-400">For Duplicates</span>
                  </label>
                  <select
                    value={columnMapping.reference_id || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, reference_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Category (Optional) */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Category Column</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <select
                    value={columnMapping.category || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                  >
                    <option value="">-- Auto-Categorize from Narration --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Payment Mode (Optional) */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Payment Mode</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <select
                    value={columnMapping.payment_mode || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, payment_mode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                  >
                    <option value="">-- Auto-Detect (UPI / Card / Cash) --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className="px-6 py-2.5 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Preview &amp; Classify Transactions</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 & 5: PREVIEW, CLASSIFICATION & DUPLICATE REVIEW */}
          {(currentStep === 4 || currentStep === 5) && (
            <div className="space-y-4">
              {/* Summary Stats Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Detected</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{stats.totalDetected}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                  <span className="text-[10px] text-[#6C47FF] dark:text-[#A78BFA] block">Ready to Import</span>
                  <span className="font-extrabold text-[#6C47FF] dark:text-[#A78BFA] text-sm">{stats.selectedCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-[10px] text-rose-500 block">Total Expense</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(stats.totalExpense)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-[10px] text-emerald-500 block">Total Income</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(stats.totalIncome)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <span className="text-[10px] text-blue-500 block">Self Transfers</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{stats.transferCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <span className="text-[10px] text-amber-500 block">Duplicates Found</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{stats.duplicateCount}</span>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewFilter === 'all' ? 'bg-white dark:bg-[#16132A] text-[#6C47FF] shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    All ({candidates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ready')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewFilter === 'ready' ? 'bg-white dark:bg-[#16132A] text-emerald-600 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    Unique ({stats.selectedCount})
                  </button>
                  {stats.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('duplicates')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        previewFilter === 'duplicates' ? 'bg-white dark:bg-[#16132A] text-amber-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      Duplicates ({stats.duplicateCount})
                    </button>
                  )}
                  {stats.transferCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('transfers')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        previewFilter === 'transfers' ? 'bg-white dark:bg-[#16132A] text-blue-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      Transfers ({stats.transferCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search description, category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#6C47FF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Candidate Table */}
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={candidates.length > 0 && candidates.every(c => c.selected)}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded text-[#6C47FF] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description / Narration</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredCandidates.map(c => (
                      <tr 
                        key={c.tempId}
                        className={`transition-colors ${
                          c.selected 
                            ? 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]' 
                            : 'opacity-40 bg-slate-50/30 dark:bg-white/[0.01]'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={c.selected}
                            onChange={() => handleToggleSelect(c.tempId)}
                            className="rounded text-[#6C47FF] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {c.date}
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <input
                            type="text"
                            value={c.description}
                            onChange={(e) => handleCandidateChange(c.tempId, 'description', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg text-xs bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-[#6C47FF] focus:bg-white dark:focus:bg-[#16132A] truncate"
                          />
                          {c.raw_narration && c.raw_narration !== c.description && (
                            <span className="block text-[10px] text-slate-400 truncate font-mono">
                              {c.raw_narration}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.type}
                            onChange={(e) => handleCandidateChange(c.tempId, 'type', e.target.value)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="refund">Refund</option>
                            <option value="transfer">Self Transfer</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.category}
                            onChange={(e) => handleCandidateChange(c.tempId, 'category', e.target.value)}
                            className="px-2 py-1 rounded-lg text-[11px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 max-w-[130px]"
                          >
                            {userCategories.length > 0 ? (
                              userCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)
                            ) : (
                              <>
                                <option value="Food & Dining">Food &amp; Dining</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Bills & Utilities">Bills &amp; Utilities</option>
                                <option value="Rent & Housing">Rent &amp; Housing</option>
                                <option value="Health">Health</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Education">Education</option>
                                <option value="Travel">Travel</option>
                                <option value="Personal Care">Personal Care</option>
                                <option value="EMI & Loans">EMI &amp; Loans</option>
                                <option value="Other">Other</option>
                              </>
                            )}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={c.payment_mode}
                            onChange={(e) => handleCandidateChange(c.tempId, 'payment_mode', e.target.value)}
                            className="px-2 py-1 rounded-lg text-[11px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                          >
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Net Banking">Net Banking</option>
                            <option value="EMI">EMI</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                          <span className={c.type === 'income' ? 'text-emerald-500' : c.is_transfer ? 'text-blue-500' : 'text-slate-900 dark:text-white'}>
                            {c.type === 'income' ? '+' : ''}{formatCurrency(c.amount)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {c.duplicateStatus === 'confirmed_duplicate' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertTriangle size={11} />
                              <span>Duplicate</span>
                            </span>
                          ) : c.duplicateStatus === 'possible_duplicate' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200">
                              <HelpCircle size={11} />
                              <span>Possible Dup</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check size={11} />
                              <span>Unique</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Back to Mapping
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    <strong>{stats.selectedCount}</strong> transactions ready to import
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    disabled={stats.selectedCount === 0}
                    className="px-6 py-2.5 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Reconciliation &amp; Confirm</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: RECONCILIATION & CONFIRMATION */}
          {currentStep === 6 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Statement Verification &amp; Final Confirmation
                </h3>
                <p className="text-xs text-slate-400">
                  Verify the import summary before records are safely written to your personal ledger
                </p>
              </div>

              {/* Arithmetic Reconciliation Card (if balances present) */}
              {reconciliation.hasBalances && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  reconciliation.reconciled
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {reconciliation.reconciled ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500" />
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {reconciliation.reconciled ? 'Statement Arithmetically Reconciled' : 'Statement Balance Variance'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      Opening: {formatCurrency(reconciliation.openingBalance)} → Closing: {formatCurrency(reconciliation.closingBalance)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Opening balance + Total Deposits ({formatCurrency(reconciliation.totalCredits)}) - Total Withdrawals ({formatCurrency(reconciliation.totalDebits)}) {reconciliation.reconciled ? 'matches closing balance.' : `differs by ${formatCurrency(reconciliation.difference)}.`}
                  </p>
                </div>
              )}

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Import Source:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{detectedBank?.bank || importSource}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Total Transactions Selected:</span>
                  <span className="font-extrabold text-[#6C47FF] text-sm">{stats.selectedCount} of {stats.totalDetected}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Total Expenses:</span>
                  <span className="font-bold text-rose-500">{formatCurrency(stats.totalExpense)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Total Income (Credits):</span>
                  <span className="font-bold text-emerald-500">{formatCurrency(stats.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Internal Self Transfers (Excluded):</span>
                  <span className="font-bold text-blue-500">{stats.transferCount} transactions ({formatCurrency(stats.totalTransfer)})</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  disabled={isImporting || stats.selectedCount === 0}
                  onClick={handleExecuteImport}
                  className="px-8 py-3 rounded-2xl bg-[#6C47FF] hover:bg-[#5835E5] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xl shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Importing... {importProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirm &amp; Import {stats.selectedCount} Transactions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: RESULTS & 1-CLICK UNDO */}
          {currentStep === 7 && importResult && (
            <div className="space-y-6 text-center max-w-md mx-auto py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs text-slate-400">
                  {importResult.importedCount} transactions safely recorded in your ledger
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Reference:</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{importResult.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Imported Expenses:</span>
                  <span className="font-bold text-rose-500">{formatCurrency(importResult.totalExpense)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Affected Months:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{importResult.affectedMonths.join(', ')}</span>
                </div>
              </div>

              {undoStatus && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs text-blue-700 dark:text-blue-300 rounded-xl">
                  {undoStatus}
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  View Transactions in Dashboard
                </button>
                {!undoStatus && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Undo This Import (Revert All {importResult.importedCount} Records)</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
