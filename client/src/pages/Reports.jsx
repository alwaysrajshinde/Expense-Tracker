import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, CreditCard, PieChart, Layers, BarChart2 } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import CustomDropdown from '../components/CustomDropdown';
import { getYearlyReports } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Reports({
  reportsData,
  selectedMonth,
  availableMonths = [],
  onSelectMonth,
  formatCurrency,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  isMobileScreen = false
}) {
  const { t } = useLanguage();
  const [internalActiveTab, setInternalActiveTab] = useState('overview'); // 'overview' | 'category' | 'payment' | 'yearly'
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = externalOnTabChange || setInternalActiveTab;
  const [selectedYear, setSelectedYear] = useState(() => (selectedMonth ? selectedMonth.slice(0, 4) : new Date().getFullYear().toString()));
  const [yearlyData, setYearlyData] = useState(null);
  const [loadingYearly, setLoadingYearly] = useState(false);

  useEffect(() => {
    if (selectedMonth) {
      setSelectedYear(selectedMonth.slice(0, 4));
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === 'yearly') {
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
  }, [activeTab, selectedYear]);

  if (!reportsData) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        Loading reports...
      </div>
    );
  }

  const {
    total_spent = 0,
    total_income = 0,
    net_balance = 0,
    tx_count = 0,
    budget = 12000,
    remaining_budget = 0,
    category_breakdown = [],
    chart_data = [],
    payment_breakdown = [],
    monthly_trend = []
  } = reportsData;

  const currentCalendarMonth = new Date().toISOString().slice(0, 7);
  const currentIdx = availableMonths.indexOf(selectedMonth);

  // Future months are strictly disabled; past months only enabled if historical data exists
  const canGoNext = Boolean(currentIdx > 0 && availableMonths[currentIdx - 1] <= currentCalendarMonth);
  const canGoPrev = Boolean(currentIdx !== -1 && currentIdx < availableMonths.length - 1);

  const handlePrevMonth = () => {
    if (canGoPrev) {
      onSelectMonth(availableMonths[currentIdx + 1]);
    }
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      onSelectMonth(availableMonths[currentIdx - 1]);
    }
  };

  const formatMonthName = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  // Donut chart math: Normalized so the slices ALWAYS complete the full 360° circle (100% of circumference)
  const donutSize = 148;
  const strokeWidth = 22;
  const center = donutSize / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Clean and complete chart data so slices always sum to 100%
  const cleanChartData = (() => {
    if (!chart_data || chart_data.length === 0) return [];
    const items = chart_data.map(item => ({
      ...item,
      percentage: parseFloat(item.percentage) || 0,
      amount: parseFloat(item.amount) || 0,
      color: (!item.color || item.color === '#94A3B8') ? '#8B5CF6' : item.color
    }));

    const totalPct = items.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPct > 0 && totalPct < 98) {
      const remainingPct = Math.round((100 - totalPct) * 10) / 10;
      const catsTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const remainingAmt = Math.max(0, total_spent - catsTotal);
      return [
        ...items,
        {
          name: 'Others',
          percentage: remainingPct,
          amount: remainingAmt,
          color: '#8B5CF6'
        }
      ];
    }
    return items;
  })();

  const totalRawPct = cleanChartData.reduce((sum, item) => sum + item.percentage, 0);
  const normalizedScale = totalRawPct > 0 ? (100 / totalRawPct) : 1;

  let cumulativeAngle = 0;
  const donutSlices = cleanChartData.map((item) => {
    const normalizedPct = item.percentage * normalizedScale;
    const strokeDasharray = `${(normalizedPct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
    cumulativeAngle += normalizedPct;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="space-y-4 px-1 sm:px-6 lg:px-8 py-2 pb-28 lg:pb-8 max-w-7xl mx-auto">
      {/* Top Header & Navigation Bar (Shown on desktop; on mobile, header and navigation pills are rendered in Header.jsx) */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Spending &amp; Expense Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'yearly'
              ? `Annual spending overview, monthly distribution, and annual categories for ${selectedYear}`
              : `Detailed analysis, category shares, and trends for ${formatMonthName(selectedMonth)}`}
          </p>
        </div>
      </div>

      {/* Unified Single Navigation Bar (Shown on desktop only; on mobile, handled in Header.jsx) */}
      <div className="hidden lg:grid w-full bg-slate-100 dark:bg-white/10 p-1 rounded-2xl grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#6C47FF] text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {t('overview', 'Overview')}
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`py-2 rounded-xl text-xs font-semibold text-center truncate px-1 transition-all cursor-pointer ${
            activeTab === 'category'
              ? 'bg-[#6C47FF] text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {t('categories', 'Categories')} ({category_breakdown.length})
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
            activeTab === 'payment'
              ? 'bg-[#6C47FF] text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {t('paymentModes', 'Payment Modes')}
        </button>
        <button
          onClick={() => setActiveTab('yearly')}
          className={`py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
            activeTab === 'yearly'
              ? 'bg-[#6C47FF] text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {t('yearly', 'Yearly')}
        </button>
      </div>

      {/* ========================================================
          YEARLY REPORT VIEW
         ======================================================== */}
      {activeTab === 'yearly' && (
        <div className="space-y-5 animate-tab-content">
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
      {activeTab !== 'yearly' && (
        <div className="space-y-5">
          {/* Month Carousel & Direct Month Picker */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#151226] p-3 sm:px-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs transition-colors">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={!canGoPrev}
                aria-label="Previous Month"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold transition-colors min-h-[40px] ${
                  canGoPrev
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
                    : 'text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous Month</span>
              </button>

              {/* Custom Direct Month Dropdown */}
              <CustomDropdown
                value={selectedMonth}
                onChange={(val) => onSelectMonth(val)}
                options={(availableMonths || []).map((m) => ({
                  value: m,
                  label: formatMonthName(m)
                }))}
                icon={Calendar}
                ariaLabel="Select report month"
                buttonClassName="bg-purple-50 dark:bg-purple-950/50 border-purple-200/60 dark:border-purple-800/40 text-[#6C47FF] dark:text-[#A78BFA] font-extrabold"
              />

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canGoNext}
                aria-label="Next Month"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold transition-colors min-h-[40px] ${
                  canGoNext
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
                    : 'text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Next Month</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              <span>{tx_count} recorded {tx_count === 1 ? 'entry' : 'entries'} in {formatMonthName(selectedMonth)}</span>
            </div>
          </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spend */}
        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors interactive-card">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            {t('totalSpent', 'Total Spend')}
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(total_spent)}
          </span>
        </div>

        {/* Total Income / Refunds */}
        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors interactive-card">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            {t('incomeCredits', 'Income & Credits')}
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(total_income || 0)}
          </span>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors interactive-card">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            {t('netCashflow', 'Net Cashflow')}
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
            (net_balance !== undefined ? net_balance : (total_income - total_spent)) >= 0 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-slate-900 dark:text-white'
          }`}>
            {(net_balance !== undefined ? net_balance : (total_income - total_spent)) >= 0 ? '+' : ''}
            {formatCurrency(net_balance !== undefined ? net_balance : (total_income - total_spent))}
          </span>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white dark:bg-[#151226] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm transition-colors interactive-card">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
            {t('remainingBudget', 'Remaining Budget')}
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
            remaining_budget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {formatCurrency(remaining_budget)}
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW (Desktop: Side-by-Side Grid) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 animate-tab-content">
          {/* Spending by Category (Donut + Legend) */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-5 transition-colors">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t('spendingByCategory', 'Spending by Category')}
            </h3>

            {chart_data.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">
                No spending data for this month.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Donut Chart with guaranteed full 360° circular track */}
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  <svg width={donutSize} height={donutSize} className="transform -rotate-90">
                    {/* Background circular track */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      className="text-slate-100 dark:text-white/10"
                    />
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
                  {cleanChartData.map((item) => (
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
                {t('monthlySpendingTrend', 'Monthly Spending Trend')}
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {t('last6Months', 'Last 6 Months')}
              </span>
            </div>

            {(() => {
              // Ensure we ALWAYS have continuous 6 months ending at selectedMonth
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const [selY, selM] = (selectedMonth || '2026-11').split('-').map(Number);
              
              const trendMap = {};
              (monthly_trend || []).forEach(m => {
                if (m.month_key) {
                  trendMap[m.month_key] = parseFloat(m.total) || 0;
                }
              });

              const sixMonthsTrend = [];
              for (let i = 5; i >= 0; i--) {
                const d = new Date(selY, selM - 1 - i, 1);
                const yStr = String(d.getFullYear());
                const mNum = String(d.getMonth() + 1).padStart(2, '0');
                const mk = `${yStr}-${mNum}`;
                const shortLabel = monthNames[d.getMonth()];
                const total = trendMap[mk] !== undefined ? trendMap[mk] : 0;
                sixMonthsTrend.push({
                  month_key: mk,
                  label: shortLabel,
                  month_label: `${shortLabel} '${yStr.slice(2)}`,
                  total,
                  is_current: mk === selectedMonth
                });
              }

              const maxTrendSpend = Math.max(...sixMonthsTrend.map(m => m.total || 0), budget || 0, 1000);
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
                  <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 h-44 border-b border-slate-100 dark:border-white/10 pb-1">
                    {sixMonthsTrend.map((m) => {
                      const hasSpend = m.total > 0;
                      const heightPercent = hasSpend
                        ? Math.min(100, Math.max(12, (m.total / yAxisMax) * 100))
                        : 3;
                      const isCurrent = m.is_current;

                      return (
                        <div
                          key={m.month_key}
                          onClick={() => {
                            if (availableMonths.includes(m.month_key)) {
                              onSelectMonth(m.month_key);
                            }
                          }}
                          className={`flex-1 flex flex-col items-center gap-2 group ${
                            availableMonths.includes(m.month_key) ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          {/* Tooltip / Highlight pill for active */}
                          <div className="h-6 flex items-center justify-center">
                            {isCurrent ? (
                              <span className="text-[10px] font-black bg-[#6C47FF] dark:bg-[#8B5CF6] text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                                {formatCurrency(m.total)}
                              </span>
                            ) : hasSpend ? (
                              <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {formatCurrency(m.total)}
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                ₹0
                              </span>
                            )}
                          </div>

                          {/* Bar */}
                          <div className="w-full max-w-[34px] h-32 flex items-end">
                            <div
                              className={`w-full rounded-t-xl transition-all duration-500 ${
                                isCurrent
                                  ? 'bg-gradient-to-t from-[#5B27DC] to-[#7B42F6] dark:from-[#7C3AED] dark:to-[#A78BFA] shadow-md shadow-purple-500/30'
                                  : hasSpend
                                  ? 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20'
                                  : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>

                          {/* Month label */}
                          <span
                            className={`text-[11px] sm:text-xs transition-colors ${
                              isCurrent
                                ? 'font-bold text-[#6C47FF] dark:text-[#A78BFA]'
                                : 'font-medium text-slate-500 dark:text-slate-400'
                            }`}
                          >
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

      {/* SUB-TAB 2: FULL CATEGORY BREAKDOWN WITH VISUAL RANKING CHART */}
      {activeTab === 'category' && (
        <div className="space-y-5 animate-tab-content">
          {/* Visual Top Categories Bar Chart */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#6C47FF] dark:text-[#A78BFA]" />
                  <span>Category Spending Distribution</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visual ranking of expenditures across all {category_breakdown.length} categories
                </p>
              </div>
              {category_breakdown.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6C47FF] dark:text-[#A78BFA] text-xs font-bold self-start">
                  <span>Top: {category_breakdown[0]?.name || category_breakdown[0]?.category}</span>
                  <span>({category_breakdown[0]?.percentage}%)</span>
                </div>
              )}
            </div>

            {/* Top 6 Visual Horizontal Ranked Bars */}
            <div className="space-y-3 pt-2">
              {category_breakdown.slice(0, 6).map((cat, idx) => {
                const catName = cat.name || cat.category || 'Other';
                const catTotal = parseFloat(cat.total || cat.amount || 0);
                const maxCatAmt = Math.max(...category_breakdown.map(c => parseFloat(c.total || c.amount || 0)), 1);
                const barWidth = Math.min(100, Math.max(8, (catTotal / maxCatAmt) * 100));

                return (
                  <div key={catName + idx} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 w-4">#{idx + 1}</span>
                        <CategoryIcon name={catName} icon={cat.icon} color={cat.color} size={14} />
                        <span className="text-slate-800 dark:text-slate-100 font-bold truncate max-w-[140px] sm:max-w-xs">{catName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(catTotal)}</span>
                        <span className="text-[11px] font-bold text-[#6C47FF] dark:text-[#A78BFA] w-11 text-right">{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: cat.color || '#6C47FF'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Category Expenditures Cards */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Category Expenditures ({category_breakdown.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category_breakdown.map((cat, idx) => {
                const catName = cat.name || cat.category || 'Other';
                const catTotal = parseFloat(cat.total || cat.amount || 0);
                const txs = cat.count || cat.tx_count || 0;
                return (
                  <div
                    key={catName + idx}
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
                          <CategoryIcon name={catName} icon={cat.icon} color={cat.color} size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {catName}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {txs} {txs === 1 ? 'transaction' : 'transactions'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                          {formatCurrency(catTotal)}
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PAYMENT BREAKDOWN WITH VISUAL SHARE GRAPH */}
      {activeTab === 'payment' && (
        <div className="space-y-5 animate-tab-content">
          {/* Visual Payment Methods Distribution Bar */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-[#6C47FF] dark:text-[#A78BFA]" />
                  <span>Payment Channels Split</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Relative volume and spending across payment instruments
                </p>
              </div>
            </div>

            {/* Multi-segment stacked distribution progress bar */}
            <div className="space-y-3 pt-2">
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-white/5 shadow-inner">
                {payment_breakdown.map((pm, idx) => {
                  const colors = ['#6C47FF', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
                  const color = colors[idx % colors.length];
                  const pct = Math.max(2, parseFloat(pm.percentage) || 0);
                  return (
                    <div
                      key={pm.payment_mode || pm.mode || idx}
                      title={`${pm.payment_mode || pm.mode}: ${pm.percentage}%`}
                      className="h-full transition-all duration-500 hover:brightness-110"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color
                      }}
                    />
                  );
                })}
              </div>

              {/* Legend with percentages */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {payment_breakdown.map((pm, idx) => {
                  const colors = ['#6C47FF', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={pm.payment_mode || pm.mode || idx} className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-slate-700 dark:text-slate-300">{pm.payment_mode || pm.mode}</span>
                      <span className="font-bold text-slate-900 dark:text-white">({pm.percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment Mode Detail Cards */}
          <div className="bg-white dark:bg-[#151226] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Payment Mode Breakdown Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payment_breakdown.map((pm, idx) => {
                const pmMode = pm.payment_mode || pm.mode || 'UPI';
                const pmTotal = parseFloat(pm.total || pm.amount || 0);
                const txs = pm.count || pm.tx_count || 0;
                return (
                  <div
                    key={pmMode + idx}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {pmMode}
                      </span>
                      <span className="text-xs font-extrabold text-[#6C47FF] dark:text-[#A78BFA] bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                        {pm.percentage}% of total
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(pmTotal)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {txs} recorded {txs === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
