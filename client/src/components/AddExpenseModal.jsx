import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Receipt, RotateCcw, Search, Calendar, FileText, Check, Plus,
  Send, Banknote, CreditCard, Landmark, ChevronDown
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  editingTransaction = null,
  initialDate = new Date().toISOString().slice(0, 10),
  onSaveAnotherSuccess
}) {
  const [isRefund, setIsRefund] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [searchCat, setSearchCat] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [date, setDate] = useState(initialDate);
  const [description, setDescription] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [miniSuccess, setMiniSuccess] = useState(false);

  // Dynamically derive quick categories from user's custom or system categories
  const quickCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [
        { name: 'Food & Dining', icon: 'Utensils', color: '#6C47FF' },
        { name: 'Groceries', icon: 'ShoppingBag', color: '#10B981' },
        { name: 'Transportation', icon: 'Car', color: '#F59E0B' },
        { name: 'Shopping', icon: 'Shirt', color: '#EC4899' },
        { name: 'Bills & Utilities', icon: 'Zap', color: '#3B82F6' },
        { name: 'Other', icon: 'Tag', color: '#64748B' }
      ];
    }
    const quick = categories.filter((c) => Boolean(c.is_quick));
    if (quick.length >= 3) return quick.slice(0, 6);
    return categories.slice(0, 6);
  }, [categories]);

  useEffect(() => {
    if (editingTransaction) {
      setIsRefund(Boolean(editingTransaction.amount < 0 || editingTransaction.is_refund));
      setAmount(String(Math.abs(editingTransaction.amount)));
      setCategory(editingTransaction.category || (categories[0]?.name || 'Food'));
      setPaymentMode(editingTransaction.payment_mode || 'UPI');
      setDate(editingTransaction.date || initialDate);
      setDescription(editingTransaction.description || '');
    } else {
      setIsRefund(false);
      setAmount('');
      const defaultCat = quickCategories[0]?.name || categories[0]?.name || 'Food';
      setCategory(defaultCat);
      setSearchCat('');
      setPaymentMode('UPI');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setDescription('');
    }
    setError('');
    setShowAllCategories(false);
    setMiniSuccess(false);
  }, [editingTransaction, isOpen, initialDate, categories, quickCategories]);

  // Support closing modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e, keepOpen = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!date) {
      setError('Please choose a date');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave({
        id: editingTransaction?.id,
        amount: parseFloat(amount),
        category,
        payment_mode: paymentMode,
        date,
        description,
        is_refund: isRefund
      });

      if (keepOpen) {
        setAmount('');
        setDescription('');
        setMiniSuccess(true);
        setTimeout(() => setMiniSuccess(false), 2000);
        if (onSaveAnotherSuccess) onSaveAnotherSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(searchCat.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#16132A] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-white/10 animate-slide-up transition-colors">
        {/* Drag handle pill on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Edit Expense' : 'Add Expense'}
            </h2>
            {miniSuccess && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full animate-fade-in flex items-center gap-1">
                <Check size={12} strokeWidth={2.5} />
                <span>Saved!</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form noValidate onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense vs Refund / Return */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-white/10 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsRefund(false)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all ${!isRefund
                ? 'bg-[#6C47FF] dark:bg-[#7C3AED] text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Receipt size={16} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRefund(true)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all ${isRefund
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <RotateCcw size={16} />
              <span>Refund / Return</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-slate-800 dark:text-slate-200">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category * {category && <span className="text-[#6C47FF] dark:text-[#A78BFA] font-semibold">({category})</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs font-semibold text-[#6C47FF] dark:text-[#A78BFA] hover:underline"
              >
                {showAllCategories ? 'Show Quick' : `All ${categories.length} Categories`}
              </button>
            </div>

            {/* Search Category */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search category..."
                value={searchCat}
                onChange={(e) => {
                  setSearchCat(e.target.value);
                  if (e.target.value) setShowAllCategories(true);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all"
              />
            </div>

            {/* Quick Category Grid or All Categories */}
            {!showAllCategories && !searchCat ? (
              <div className="grid grid-cols-3 gap-2.5">
                {quickCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${isSelected
                        ? 'border-[#6C47FF] dark:border-[#8B5CF6] bg-purple-50/70 dark:bg-purple-950/60 text-[#6C47FF] dark:text-[#A78BFA] shadow-sm'
                        : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <div className={`p-2 rounded-xl mb-1.5 ${isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-[#6C47FF] dark:text-[#A78BFA]'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                        }`}>
                        <CategoryIcon name={cat.name} icon={cat.icon} color={isSelected ? '#6C47FF' : undefined} size={20} />
                      </div>
                      <span className="text-xs font-semibold truncate max-w-full">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-100 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5">
                {filteredCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.id || cat.name}
                      type="button"
                      onClick={() => {
                        setCategory(cat.name);
                        setShowAllCategories(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${isSelected
                        ? 'border-[#6C47FF] dark:border-[#8B5CF6] bg-purple-50 dark:bg-purple-950/60 text-[#6C47FF] dark:text-[#A78BFA] font-bold shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                    >
                      <CategoryIcon name={cat.name} icon={cat.icon} color={cat.color} size={16} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-slate-400">
                    No matching category found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Mode *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'UPI', label: 'UPI', icon: Send },
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
                { id: 'Debit Card', label: 'Debit Card', icon: CreditCard },
                { id: 'Net Banking', label: 'Net Banking', icon: Landmark }
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-2xl border font-semibold text-xs transition-all cursor-pointer ${isSelected
                      ? 'bg-[#6C47FF] dark:bg-[#7C3AED] border-[#6C47FF] text-white shadow-md shadow-purple-500/20'
                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <span className="truncate">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all shadow-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <div className="relative flex items-center">
              <FileText size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Lunch with colleagues"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons: Save & Add Another + Save Expense */}
          <div className="pt-2 flex items-center gap-3">
            {!editingTransaction && (
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Save &amp; Add Another</span>
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`py-3.5 bg-gradient-to-r from-[#5B27DC] to-[#7B42F6] hover:from-[#4E1FC5] hover:to-[#6E32E9] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                editingTransaction ? 'w-full' : 'flex-1'
              }`}
            >
              <Check size={18} strokeWidth={2.5} />
              <span>{saving ? 'Saving...' : editingTransaction ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
