import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, CreditCard, PieChart, Layers, BarChart2 } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import { getYearlyReports } from '../services/api';

export default function Reports({
  reportsData,
  selectedMonth,
  availableMonths = [],
  onSelectMonth,
  formatCurrency
}) {
  const [reportMode, setReportMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'category' | 'payment'
  const [selectedYear, setSelectedYear] = useState(() => (selectedMonth ? selectedMonth.slice(0, 4) : new Date().getFullYear().toString()));
  const [yearlyData, setYearlyData] = useState(null);
  const [loadingYearly, setLoadingYearly] = useState(false);

  useEffect(() => {
    if (selectedMonth) {
      setSelectedYear(selectedMonth.slice(0, 4));
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (reportMode === 'yearly') {
      const loadYearly = async () => {
        try {
          setLoadingYearly(true);
          const data = await getYearlyReports(selectedYear);
          setYearlyData(data);
        } catch (e) {
          console.error('Error loading yearly reports:', e);
        } finally {
          setLoadingYearly(false);
        }
      };
      loadYearly();
    }
  }, [reportMode, selectedYear]);

  if (!reportsData) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        Loading reports...
      </div>
    );
  }

  const {
    total_spent = 0,
    tx_count = 0,
    budget = 12000,
    remaining_budget = 0,
    category_breakdown = [],
    chart_data = [],
    payment_breakdown = [],
    monthly_trend = []
  } = reportsData;

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
  const donutSize = 140;
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
    <div className="space-y-5 px-4 sm:px-6 lg:px-8 py-4 pb-28 lg:pb-8 max-w-7xl mx-auto">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Spending &amp; Expense Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {reportMode === 'monthly'
              ? `Detailed analysis, category shares, and trends for ${formatMonthName(selectedMonth)}`
              : `Annual spending overview, monthly distribution, and annual categories for ${selectedYear}`}
          </p>
        </div>

        {/* Monthly vs Yearly Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setReportMode('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportMode === 'monthly'
                  ? 'bg-[#6C47FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setReportMode('yearly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportMode === 'yearly'
                  ? 'bg-[#6C47FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Yearly Summary
            </button>
          </div>

          {/* Segmented Sub-Tabs (Monthly only) */}
          {reportMode === 'monthly' && (
            <div className="flex bg-slate-100 dark:bg-white/10 p-1 rounded-2xl w-full sm:w-auto self-start overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  subTab === 'overview'
                    ? 'bg-[#6C47FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSubTab('category')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  subTab === 'category'
                    ? 'bg-[#6C47FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Categories ({category_breakdown.length})
              </button>
              <button
                onClick={() => setSubTab('payment')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  subTab === 'payment'
                    ? 'bg-[#6C47FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Payment Modes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          YEARLY REPORT VIEW
         ======================================================== */}
      {reportMode === 'yearly' && (
        <div className="space-y-5 animate-fade-in">
          {/* Year Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#151226] p-3 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Accounting Year:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(yearlyData?.available_years || [selectedYear]).map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedYear === y
                      ? 'bg-[#6C47FF] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Annual KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 border border-slate-100 dark:border-white/10 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Spent in {selectedYear}</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(yearlyData?.total_spent || 0)}
              </div>
              <p className="text-[11px] text-slate-400">{yearlyData?.tx_count || 0} recorded transactions</p>
            </div>

            <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 border border-slate-100 dark:border-white/10 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Monthly Average Spend</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {formatCurrency(yearlyData?.monthly_average || 0)}
              </div>
              <p className="text-[11px] text-slate-400">Across 12 months</p>
            </div>

            <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 border border-slate-100 dark:border-white/10 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Peak Spending Month</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {yearlyData?.highest_month?.label || 'None'}
              </div>
              <p className="text-[11px] text-slate-400">
                {formatCurrency(yearlyData?.highest_month?.total || 0)}
              </p>
            </div>
          </div>

          {/* 12-Month Bar Chart */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-[#6C47FF]" />
              <span>12-Month Annual Spend Distribution ({selectedYear})</span>
            </h3>

            <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-48 pt-6">
              {(yearlyData?.months_data || []).map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {formatCurrency(m.total)}
                  </div>
                  <div className="w-full max-w-[28px] h-36 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#5B27DC] to-[#7B42F6] dark:from-[#7C3AED] dark:to-[#A78BFA] transition-all duration-500 hover:brightness-110"
                      style={{ height: `${Math.max(m.height_percent, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Annual Category Breakdown */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Annual Category Distribution ({selectedYear})
            </h3>

            <div className="space-y-3">
              {(yearlyData?.category_breakdown || []).map((cat, idx) => (
                <div key={cat.category} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color || '#6C47FF'}20` }}
                      >
                        <CategoryIcon name={cat.category} icon={cat.icon} color={cat.color} size={15} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="text-[11px] font-bold text-[#6C47FF] dark:text-[#A78BFA]">
                        {cat.percentage}%
                      </span>
                    </div>
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
          </div>
        </div>
      )}

      {/* ========================================================
          MONTHLY REPORT VIEW (Existing refined sub-tabs)
         ======================================================== */}
      {reportMode === 'monthly' && (
        <div className="space-y-5">
          {/* Month Carousel Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-[#151226] p-2.5 sm:px-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs transition-colors">
            <button
              onClick={handlePrevMonth}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Previous Month</span>
            </button>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-full text-xs font-extrabold text-[#6C47FF] dark:text-[#A78BFA]">
              <Calendar size={14} />
              <span>{formatMonthName(selectedMonth)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={!hasNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Next Month</span>
              <ChevronRight size={15} />
            </button>
          </div>

      {/* 4 Summary Stat Cards on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            Total Spend
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(total_spent)}
          </span>
        </div>

        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            Total Transactions
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tx_count}
          </span>
        </div>

        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            Budget
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(budget)}
          </span>
        </div>

        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            Remaining Budget
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
            remaining_budget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {formatCurrency(remaining_budget)}
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW (Desktop: Side-by-Side Grid) */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Spending by Category (Donut + Legend) */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Spending by Category
            </h3>

            {chart_data.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">
                No spending data for this month.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Donut Chart */}
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
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {formatCurrency(total_spent)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Total
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {chart_data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color || '#6C47FF' }}
                        />
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white ml-2">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Trend Bar Chart */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Monthly Spending Trend
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Last 6 Months
              </span>
            </div>

            {(() => {
              const maxTrendSpend = Math.max(...monthly_trend.map(m => m.total || 0), budget || 0, 1000);
              const yAxisMax = Math.max(5000, Math.ceil(maxTrendSpend / 5000) * 5000);
              const formatTick = (val) => (val >= 1000 ? `${Math.round(val / 1000)}K` : String(val));
              const ticks = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0];

              return (
                <div className="flex gap-4 pt-4 pb-1">
                  {/* Y Axis ticks */}
                  <div className="flex flex-col justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 pr-1 h-44">
                    {ticks.map((t, idx) => (
                      <span key={idx}>{formatTick(t)}</span>
                    ))}
                  </div>

                  {/* Bars */}
                  <div className="flex-1 flex items-end justify-between gap-3 h-44 border-b border-slate-100 dark:border-white/10 pb-1">
                    {monthly_trend.map((m) => {
                      const heightPercent = Math.min(100, Math.max(8, (m.total / yAxisMax) * 100));
                      const isCurrent = m.month_key === selectedMonth;

                      return (
                        <div
                          key={m.month_key}
                          onClick={() => onSelectMonth(m.month_key)}
                          className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                        >
                      {/* Tooltip / Highlight pill for active */}
                      <div className="h-6 flex items-center justify-center">
                        {isCurrent ? (
                          <span className="text-[10px] font-black bg-[#6C47FF] dark:bg-[#8B5CF6] text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap animate-bounce">
                            {formatCurrency(m.total)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatCurrency(m.total)}
                          </span>
                        )}
                      </div>

                      {/* Bar */}
                      <div className="w-full max-w-[34px] h-32 flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-[#5B27DC] to-[#7B42F6] dark:from-[#7C3AED] dark:to-[#A78BFA] shadow-md shadow-purple-500/30'
                              : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Month label */}
                      <span className={`text-xs transition-colors ${
                        isCurrent ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]' : 'font-medium text-slate-500 dark:text-slate-400'
                      }`}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FULL CATEGORY BREAKDOWN */}
      {subTab === 'category' && (
        <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              All Category Expenditures ({category_breakdown.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category_breakdown.map((cat, idx) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0"
                      style={{ backgroundColor: `${cat.color || '#6C47FF'}20` }}
                    >
                      <CategoryIcon name={cat.name} icon={cat.icon} color={cat.color} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-xs font-bold text-[#6C47FF] dark:text-[#A78BFA]">
                      {cat.percentage}%
                    </span>
                  </div>
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
        </div>
      )}

      {/* SUB-TAB 3: PAYMENT BREAKDOWN */}
      {subTab === 'payment' && (
        <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Payment Mode Distribution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {payment_breakdown.map((pm) => (
              <div
                key={pm.mode}
                className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {pm.mode}
                  </span>
                  <span className="text-xs font-extrabold text-[#6C47FF] dark:text-[#A78BFA] bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                    {pm.percentage}% of total
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(pm.amount)}
                </div>
                <div className="text-xs text-slate-400">
                  {pm.count} recorded transactions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
