import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, Edit2, Trash2, ArrowDownLeft, ArrowUpRight,
  ChevronLeft, ChevronRight, X, AlertCircle, FileSpreadsheet, Download
} from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import { getTransactions, getCurrentUserEmail } from '../services/api';
import { exportTransactionsToExcel, exportDataToJson } from '../services/exportService';
import { useToast } from '../context/ToastContext';

export default function Transactions({
  selectedMonth,
  categories = [],
  availableMonths = [],
  onEditTransaction,
  onDeleteTransaction,
  formatCurrency,
  onSelectMonth
}) {
  const { showToast } = useToast();
  const [transactionsData, setTransactionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(selectedMonth || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (selectedMonth && selectedMonth !== monthFilter) {
      setMonthFilter(selectedMonth);
      setPage(1);
    }
  }, [selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions({
        month: monthFilter && monthFilter !== 'all' ? monthFilter : undefined,
        category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
        payment_mode: paymentFilter && paymentFilter !== 'all' ? paymentFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 40
      });
      if (data) {
        setTransactionsData(data);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMonthFilter(selectedMonth || 'all');
    setPage(1);
  }, [selectedMonth]);

  useEffect(() => {
    loadTransactions();
  }, [monthFilter, categoryFilter, paymentFilter, debouncedSearch, page]);

  const handleDelete = async (id) => {
    try {
      await onDeleteTransaction(id);
      setDeleteConfirmId(null);
      showToast('Transaction deleted successfully', 'success');
      loadTransactions();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const formatted = dt.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
    if (dateStr === todayStr) {
      return `Today · ${formatted}`;
    }
    return formatted;
  };

  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'all') return 'All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5 px-4 sm:px-6 lg:px-8 py-4 pb-24 lg:pb-8 max-w-7xl mx-auto">
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Expense Records & History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {transactionsData?.total_count || 0} entries found · Total Net Spend: <strong className="text-slate-900 dark:text-white">{formatCurrency(transactionsData?.total_amount || 0)}</strong>
          </p>
        </div>

        {/* Desktop Quick Export buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/excel?user_email=${encodeURIComponent(getCurrentUserEmail())}`}
            onClick={(e) => {
              if (window.location.hostname.includes('github.io') || !window.location.port) {
                e.preventDefault();
                exportTransactionsToExcel(transactionsData?.transactions || [], `Expenses_${selectedMonth || 'all'}.xlsx`);
              }
            }}
            download="Daily_Expenses_Export.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#151226] border border-slate-200 dark:border-white/10 hover:border-purple-300 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </a>
          <a
            href={`/api/export/json?user_email=${encodeURIComponent(getCurrentUserEmail())}`}
            onClick={(e) => {
              if (window.location.hostname.includes('github.io') || !window.location.port) {
                e.preventDefault();
                exportDataToJson(transactionsData || {}, `Expenses_${selectedMonth || 'all'}.json`);
              }
            }}
            download="expense_tracker_backup.json"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#151226] border border-slate-200 dark:border-white/10 hover:border-purple-300 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <Download size={15} className="text-[#6C47FF] dark:text-[#8B5CF6]" />
            <span className="hidden sm:inline">JSON Backup</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white dark:bg-[#151226] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm space-y-3 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, category, date, or amount..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Month Dropdown */}
          <div className="md:col-span-3">
            <select
              value={monthFilter}
              onChange={(e) => {
                const val = e.target.value;
                setMonthFilter(val);
                setPage(1);
                if (val !== 'all' && onSelectMonth) {
                  onSelectMonth(val);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div className="md:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
            >
              <option value="all">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List Grouped By Date */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading transactions...
        </div>
      ) : transactionsData?.grouped?.length === 0 ? (
        <div className="bg-white dark:bg-[#151226] rounded-3xl p-10 border border-slate-100 dark:border-white/10 text-center space-y-2">
          <AlertCircle size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching transactions</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactionsData?.grouped?.map((group) => (
            <div
              key={group.date}
              className="bg-white dark:bg-[#151226] rounded-3xl border border-slate-100 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-3 transition-colors"
            >
              {/* Day Header with Daily Total */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/5">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDateHeader(group.date)}
                </span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${group.total < 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200'
                  }`}>
                  Daily: {formatCurrency(group.total)}
                </span>
              </div>

              {/* Transactions in this day */}
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {group.transactions.map((tx) => {
                  const isRefund = Boolean(tx.amount < 0 || tx.is_refund);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between group hover:bg-slate-50/80 dark:hover:bg-white/5 p-2.5 rounded-2xl transition-colors"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${tx.color || '#6C47FF'}20` }}
                        >
                          <CategoryIcon name={tx.category} icon={tx.icon} color={tx.color} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {tx.description || tx.category}
                            </span>
                            {isRefund && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                Refund
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {tx.category}
                            </span>
                            <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                              {tx.payment_mode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3">
                        <span className={`text-xs sm:text-sm font-extrabold tracking-tight ${isRefund
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                          }`}>
                          {isRefund ? `+${formatCurrency(Math.abs(tx.amount))}` : formatCurrency(tx.amount)}
                        </span>

                        <div className="flex items-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C47FF] hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(tx.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {transactionsData?.total_pages > 1 && (
            <div className="flex items-center justify-between py-3 bg-white dark:bg-[#151226] px-5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs transition-colors">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Page {page} of {transactionsData.total_pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(transactionsData.total_pages, p + 1))}
                disabled={page === transactionsData.total_pages}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A172B] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Delete Transaction?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently delete this record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
