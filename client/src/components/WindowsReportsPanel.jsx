import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function WindowsReportsPanel({
  reportsData,
  selectedMonth = '2026-11',
  availableMonths = [],
  onSelectMonth,
  formatCurrency
}) {
  const [subTab, setSubTab] = useState('overview');

  const {
    total_spent = 0,
    tx_count = 0,
    chart_data = [],
    monthly_trend = [],
    category_breakdown = [],
    payment_breakdown = []
  } = reportsData || {};

  const currentIdx = availableMonths.indexOf(selectedMonth);
  const hasNext = currentIdx > 0;
  const hasPrev = currentIdx < availableMonths.length - 1;

  const handlePrevMonth = () => {
    if (hasPrev) onSelectMonth(availableMonths[currentIdx + 1]);
  };

  const handleNextMonth = () => {
    if (hasNext) onSelectMonth(availableMonths[currentIdx - 1]);
  };

  const formatMonthName = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  // Donut chart math
  const donutSize = 135;
  const strokeWidth = 22;
  const center = donutSize / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const donutSlices = chart_data.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
    cumulativeAngle += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="w-full xl:w-[360px] bg-white dark:bg-[#151226] border border-slate-100 dark:border-white/10 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Reports
        </h2>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-2xl">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'overview'
              ? 'bg-[#6C47FF] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSubTab('category')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'category'
              ? 'bg-[#6C47FF] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Category
        </button>
        <button
          onClick={() => setSubTab('payment')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'payment'
              ? 'bg-[#6C47FF] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Payment
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between py-0.5">
        <button
          onClick={handlePrevMonth}
          disabled={!hasPrev}
          className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200">
          <Calendar size={13} className="text-[#6C47FF] dark:text-[#A78BFA]" />
          <span>{formatMonthName(selectedMonth)}</span>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={!hasNext}
          className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block mb-1">
            Total Spend
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(total_spent)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block mb-1">
            Transactions
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {tx_count}
          </span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          {/* Spending by Category Card */}
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Spending by Category
            </h3>

            <div className="flex items-center justify-between gap-3">
              {/* Donut chart */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <svg width={donutSize} height={donutSize} className="transform -rotate-90">
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={slice.name || i}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color || '#6C47FF'}
                      strokeWidth={strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {formatCurrency(total_spent)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {chart_data.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || '#6C47FF' }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ml-1.5">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend Bar Chart */}
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Monthly Trend (2026)
              </h3>
            </div>

            <div className="flex gap-2 pt-2 pb-1">
              {/* Y Axis ticks */}
              <div className="flex flex-col justify-between text-[9px] font-semibold text-slate-400 pr-1 h-32">
                <span>20K</span>
                <span>16K</span>
                <span>12K</span>
                <span>8K</span>
                <span>4K</span>
                <span>0</span>
              </div>

              {/* Bars */}
              <div className="flex-1 flex items-end justify-between gap-1.5 h-32 border-b border-slate-200 dark:border-white/10 pb-0.5">
                {monthly_trend.map((m) => {
                  const heightPercent = Math.min(100, Math.max(8, (m.total / 20000) * 100));
                  const isCurrent = m.month_key === selectedMonth;

                  return (
                    <div
                      key={m.month_key}
                      onClick={() => onSelectMonth(m.month_key)}
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="h-4 flex items-center justify-center">
                        {isCurrent && (
                          <span className="text-[9px] font-black bg-[#6C47FF] dark:bg-[#8B5CF6] text-white px-1 py-0.2 rounded shadow-xs whitespace-nowrap">
                            {formatCurrency(m.total)}
                          </span>
                        )}
                      </div>

                      {/* Bar */}
                      <div className="w-full max-w-[22px] h-24 flex items-end">
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-[#5B27DC] to-[#7B42F6] dark:from-[#7C3AED] dark:to-[#A78BFA] shadow-xs'
                              : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <span className={`text-[10px] ${
                        isCurrent ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]' : 'text-slate-400'
                      }`}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY */}
      {subTab === 'category' && (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {category_breakdown.map((cat, idx) => (
            <div key={cat.name} className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {idx + 1}. {cat.name}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6C47FF] dark:bg-[#8B5CF6]"
                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PAYMENT */}
      {subTab === 'payment' && (
        <div className="space-y-3">
          {payment_breakdown.map((pm) => (
            <div key={pm.mode} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{pm.mode}</span>
                <span className="text-xs font-bold text-[#6C47FF] dark:text-[#A78BFA]">{pm.percentage}%</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {formatCurrency(pm.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
