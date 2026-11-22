import React from 'react';
import { Calendar, BarChart2, Plus, ArrowRight } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';

export default function AndroidHome({
  dashboardData,
  onOpenAddExpense,
  onViewAllCategories,
  onViewAllTransactions,
  onSetBudget,
  formatCurrency
}) {
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        Loading overview...
      </div>
    );
  }

  const {
    budget = 0,
    total_spent = 0,
    remaining_budget = 0,
    percent_spent = 0,
    today_spent = 0,
    week_spent = 0,
    top_categories = [],
    recent_transactions = []
  } = dashboardData;

  const percentSpentVal = Math.round(percent_spent * 10) / 10;

  // Circular progress math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentSpentVal, 100) / 100) * circumference;

  return (
    <div className="space-y-4 px-4 pb-28 pt-1">
      {/* ========================================================
          1. Hero Purple Card (Matching Modern Purple Expense Tracker UI.png)
         ======================================================== */}
      <div className="purple-hero-gradient rounded-3xl p-5 text-white shadow-xl shadow-purple-900/15 relative flex flex-col justify-between min-h-[175px]">
        <div className="flex items-center justify-between z-10">
          <div className="space-y-2 min-w-0 flex-1 mr-2">
            <div>
              <span className="text-white/80 text-[11px] font-semibold tracking-wide uppercase">
                Monthly Budget
              </span>
              {budget > 0 ? (
                <p className="text-white text-base font-bold tracking-tight truncate">
                  {formatCurrency(budget)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onSetBudget}
                  className="mt-0.5 text-xs font-bold text-amber-200 hover:text-white underline block cursor-pointer"
                >
                  Set Monthly Budget
                </button>
              )}
            </div>

            <div>
              <span className="text-white/80 text-[11px] font-semibold tracking-wide uppercase">
                Spent
              </span>
              <p className="text-white text-2xl sm:text-3xl font-black tracking-tight truncate max-w-[170px] sm:max-w-none" title={formatCurrency(total_spent)}>
                {formatCurrency(total_spent)}
              </p>
            </div>

            <div className="pt-0.5">
              {budget > 0 ? (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-xs truncate max-w-full ${remaining_budget >= 0
                  ? 'bg-emerald-100 text-emerald-950'
                  : 'bg-rose-100 text-rose-950'
                  }`}>
                  {remaining_budget >= 0 ? 'Remaining: ' : 'Remaining: Over by '}
                  {formatCurrency(Math.abs(remaining_budget))}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-200/90 text-purple-950 shadow-xs">
                  No budget set
                </span>
              )}
            </div>
          </div>

          {/* Circular Progress Gauge */}
          <div className="relative flex items-center justify-center flex-shrink-0 mr-1">
            <svg viewBox="0 0 96 96" className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-white/20"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-white"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-extrabold tracking-tight">
                {percentSpentVal}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. Quick Stat Cards (3 Cards in a Row)
         ======================================================== */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Today */}
        <div className="bg-white dark:bg-[#16132A] rounded-2xl p-2.5 sm:p-3.5 border border-slate-100 dark:border-white/10 shadow-xs flex flex-col justify-between transition-colors min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center mb-1.5 sm:mb-2">
            <Calendar size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
              Today
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate block" title={formatCurrency(today_spent)}>
              {formatCurrency(today_spent)}
            </span>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-[#16132A] rounded-2xl p-2.5 sm:p-3.5 border border-slate-100 dark:border-white/10 shadow-xs flex flex-col justify-between transition-colors min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center mb-1.5 sm:mb-2">
            <BarChart2 size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
              This Week
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate block" title={formatCurrency(week_spent)}>
              {formatCurrency(week_spent)}
            </span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-[#16132A] rounded-2xl p-2.5 sm:p-3.5 border border-slate-100 dark:border-white/10 shadow-xs flex flex-col justify-between transition-colors min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center mb-1.5 sm:mb-2">
            <Calendar size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
              This Month
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate block" title={formatCurrency(total_spent)}>
              {formatCurrency(total_spent)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. Top Categories Card (Matching Android UI Reference)
         ======================================================== */}
      <div className="bg-white dark:bg-[#16132A] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-xs space-y-3.5 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Top Categories
          </h3>
          <button
            onClick={onViewAllCategories}
            className="text-xs font-semibold text-[#6C47FF] dark:text-[#A78BFA] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3 pt-0.5">
          {top_categories.slice(0, 3).map((cat) => (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: `${cat.color || '#6C47FF'}18` }}
                  >
                    <CategoryIcon
                      name={cat.name}
                      icon={cat.icon}
                      color={cat.color || '#6C47FF'}
                      size={15}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1.5 font-medium">
                      {cat.tx_count} txs
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {formatCurrency(cat.total)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Category Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(cat.percentage, 100)}%`,
                    backgroundColor: cat.color || '#6C47FF'
                  }}
                />
              </div>
            </div>
          ))}

          {top_categories.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-400">
              No expenses recorded for this month
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          3.5. Recent Activity Card (Mobile Activity Stream)
         ======================================================== */}
      <div className="bg-white dark:bg-[#16132A] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          <button
            onClick={onViewAllTransactions}
            className="text-xs font-semibold text-[#6C47FF] dark:text-[#A78BFA] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>See All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {recent_transactions && recent_transactions.length > 0 ? (
            recent_transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${tx.color || '#6C47FF'}18` }}
                  >
                    <CategoryIcon name={tx.category} icon={tx.icon} color={tx.color} size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate max-w-[150px]">
                      {tx.description || tx.category}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {tx.date ? new Date(tx.date).toLocaleDateString('default', { day: 'numeric', month: 'short' }) : 'Today'} · {tx.payment_mode}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-extrabold ${tx.is_refund || tx.amount < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {tx.is_refund || tx.amount < 0 ? `+${formatCurrency(Math.abs(tx.amount))}` : formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="py-3 text-center text-xs text-slate-400">
              No recent activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
