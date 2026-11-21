import React, { useState, useEffect } from 'react';
import { X, History, Trash2, CheckCircle2, RotateCcw, AlertTriangle, RefreshCw, FileText, Calendar } from 'lucide-react';
import { getImportHistory, undoImportBatch } from '../../services/import/importService';
import { useAuth } from '../../context/AuthContext';

export default function ImportHistoryModal({ isOpen, onClose, onUndoComplete }) {
  const { user } = useAuth();
  const userId = user?.uid || user?.id || 'guest';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoingBatchId, setUndoingBatchId] = useState(null);
  const [confirmBatch, setConfirmBatch] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const logs = await getImportHistory(userId);
      setHistory(logs);
    } catch (e) {
      console.warn('Could not load import logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setConfirmBatch(null);
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmUndo = async (batch) => {
    setUndoingBatchId(batch.id);
    setStatusMsg('');
    try {
      const res = await undoImportBatch(userId, batch.id);
      setStatusMsg(`Successfully reverted ${res.deletedCount} transactions from "${batch.filename}".`);
      setConfirmBatch(null);
      await loadHistory();
      if (onUndoComplete) onUndoComplete();
    } catch (err) {
      setStatusMsg(`Failed to revert: ${err.message}`);
    } finally {
      setUndoingBatchId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#16132A] rounded-3xl shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 dark:border-white/10 transition-colors animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Import History &amp; Safe Undo
              </h2>
              <p className="text-xs text-slate-400">View previous imports or safely revert records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className="px-6 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg('')}><X size={14} /></button>
          </div>
        )}

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw size={20} className="animate-spin text-[#6C47FF]" />
              <span>Loading import history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-300">
                <FileText size={24} />
              </div>
              <p className="text-xs font-semibold">No previous import batches found.</p>
              <p className="text-[11px]">When you import spreadsheets or bank statements, they will appear here with 1-click undo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(batch => (
                <div
                  key={batch.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    batch.undone
                      ? 'border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01] opacity-60'
                      : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#16132A] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {batch.filename || 'Pasted Transactions'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-900/40 text-[#6C47FF] dark:text-[#A78BFA] capitalize">
                          {batch.bank_name || batch.source}
                        </span>
                        {batch.undone ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-400">
                            Reverted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {batch.created_at ? new Date(batch.created_at).toLocaleString() : 'N/A'}
                        </span>
                        <span>•</span>
                        <span>{batch.imported_count || batch.transaction_ids?.length || 0} transactions</span>
                      </div>
                    </div>

                    {!batch.undone && (
                      <button
                        type="button"
                        onClick={() => setConfirmBatch(batch)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Undo Import</span>
                      </button>
                    )}
                  </div>

                  {/* Confirmation Sub-card */}
                  {confirmBatch?.id === batch.id && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 space-y-2 text-xs text-rose-800 dark:text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle size={15} />
                        <span>Confirm Undo for this batch?</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        This will safely remove {batch.imported_count || batch.transaction_ids?.length || 0} transactions imported from <strong>{batch.filename}</strong>. Your manually created records and other imports will remain 100% untouched.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={undoingBatchId === batch.id}
                          onClick={() => handleConfirmUndo(batch)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          {undoingBatchId === batch.id ? 'Reverting...' : 'Yes, Revert These Transactions'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmBatch(null)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
