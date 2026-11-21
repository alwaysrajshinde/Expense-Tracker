/**
 * Client-Side Engine for GitHub Pages & Google Sheets
 * Calculates real-time dashboard metrics, reports, and aggregates from synchronized Google Sheets records.
 */

// Helper: Get Today's Date in YYYY-MM-DD
export function getTodayDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Helper: Check if date is in the same week
function isDateInCurrentWeek(dateStr, refDate = new Date()) {
  const d = new Date(dateStr);
  const now = new Date(refDate);
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay() || 7;
  startOfWeek.setDate(now.getDate() - day + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return d >= startOfWeek && d <= endOfWeek;
}

/**
 * Calculate Dashboard metrics from transactions list
 */
export function computeDashboardFromTransactions(transactions = [], selectedMonth = '2026-11', budget = 12000, categoryMeta = []) {
  const todayStr = getTodayDateStr();

  // Filter for selected month
  const monthTransactions = transactions.filter(t => {
    const mk = t.month_key || (t.date ? t.date.slice(0, 7) : '');
    return mk === selectedMonth;
  });

  // Calculate totals
  let totalSpent = 0;
  let todaySpent = 0;
  let weekSpent = 0;
  const categoryTotals = {};

  monthTransactions.forEach(t => {
    let amt = parseFloat(t.amount) || 0;
    if (t.is_refund && amt > 0) amt = -amt;
    totalSpent += amt;

    if (t.date === todayStr) {
      todaySpent += amt;
    }
    if (isDateInCurrentWeek(t.date)) {
      weekSpent += amt;
    }

    const catName = t.category || 'Other';
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { total: 0, tx_count: 0 };
    }
    categoryTotals[catName].total += amt;
    categoryTotals[catName].tx_count += 1;
  });

  const remainingBudget = budget - totalSpent;
  const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // Build top categories
  const topCategories = Object.keys(categoryTotals).map(catName => {
    const catData = categoryTotals[catName];
    const meta = categoryMeta.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const pct = totalSpent > 0 ? Math.round((catData.total / totalSpent) * 1000) / 10 : 0;
    return {
      name: catName,
      total: Math.round(catData.total),
      tx_count: catData.tx_count,
      percentage: Math.max(0, pct),
      icon: meta?.icon || 'Tag',
      color: meta?.color || '#6C47FF'
    };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Recent transactions (last 10)
  const sortedMonthTx = [...monthTransactions].sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });
  const recentTransactions = sortedMonthTx.slice(0, 10).map(t => {
    const meta = categoryMeta.find(c => c.name.toLowerCase() === (t.category || '').toLowerCase());
    return {
      ...t,
      color: meta?.color || '#6C47FF',
      icon: meta?.icon || 'Tag',
      is_refund: Boolean(t.amount < 0 || t.is_refund)
    };
  });

  // Unique available months
  const monthsSet = new Set();
  transactions.forEach(t => {
    const mk = t.month_key || (t.date ? t.date.slice(0, 7) : '');
    if (mk && mk.match(/^\d{4}-\d{2}$/)) monthsSet.add(mk);
  });
  if (monthsSet.size === 0) monthsSet.add('2026-11');
  const availableMonths = Array.from(monthsSet).sort().reverse();

  return {
    month: selectedMonth,
    budget: budget,
    total_spent: Math.round(totalSpent),
    remaining_budget: Math.round(remainingBudget),
    percent_spent: Math.round(percentSpent * 10) / 10,
    today_spent: Math.round(todaySpent),
    week_spent: Math.round(weekSpent),
    today_date: todayStr,
    top_categories: topCategories,
    recent_transactions: recentTransactions,
    available_months: availableMonths
  };
}

/**
 * Calculate Reports metrics from transactions list
 */
export function computeReportsFromTransactions(transactions = [], selectedMonth = '2026-11', budget = 12000, categoryMeta = []) {
  const monthTransactions = transactions.filter(t => {
    const mk = t.month_key || (t.date ? t.date.slice(0, 7) : '');
    return mk === selectedMonth;
  });

  let totalSpent = 0;
  const categoryMap = {};
  const paymentMap = {};

  monthTransactions.forEach(t => {
    let amt = parseFloat(t.amount) || 0;
    if (t.is_refund && amt > 0) amt = -amt;
    totalSpent += amt;

    const cat = t.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += amt;
    categoryMap[cat].count += 1;

    const pm = t.payment_mode || 'UPI';
    if (!paymentMap[pm]) paymentMap[pm] = { total: 0, count: 0 };
    paymentMap[pm].total += amt;
    paymentMap[pm].count += 1;
  });

  // Category breakdown
  const categoryBreakdown = Object.keys(categoryMap).map(catName => {
    const cat = categoryMap[catName];
    const meta = categoryMeta.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const pct = totalSpent > 0 ? Math.round((cat.total / totalSpent) * 1000) / 10 : 0;
    return {
      category: catName,
      total: Math.round(cat.total),
      tx_count: cat.count,
      percentage: Math.max(0, pct),
      icon: meta?.icon || 'Tag',
      color: meta?.color || '#6C47FF'
    };
  }).sort((a, b) => b.total - a.total);

  // Donut slices (Filter positive categories for clean chart rendering)
  const chartData = categoryBreakdown.filter(c => c.total > 0).slice(0, 6).map(c => ({
    name: c.category,
    amount: c.total,
    percentage: c.percentage,
    color: c.color
  }));

  // Payment breakdown
  const paymentBreakdown = Object.keys(paymentMap).map(pm => {
    const p = paymentMap[pm];
    const pct = totalSpent > 0 ? Math.round((p.total / totalSpent) * 1000) / 10 : 0;
    return {
      payment_mode: pm,
      total: Math.round(p.total),
      tx_count: p.count,
      percentage: Math.max(0, pct)
    };
  }).sort((a, b) => b.total - a.total);

  // Monthly trend for all months
  const monthlyTotals = {};
  transactions.forEach(t => {
    const mk = t.month_key || (t.date ? t.date.slice(0, 7) : '');
    if (mk && mk.match(/^\d{4}-\d{2}$/)) {
      monthlyTotals[mk] = (monthlyTotals[mk] || 0) + (parseFloat(t.amount) || 0);
    }
  });

  const monthNames = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const monthlyTrend = Object.keys(monthlyTotals).sort().map(mk => {
    const parts = mk.split('-');
    const mStr = monthNames[parts[1]] || parts[1];
    return {
      month_key: mk,
      month_label: `${mStr} '${parts[0].slice(2)}`,
      total: Math.round(monthlyTotals[mk]),
      is_current: mk === selectedMonth
    };
  });

  return {
    month: selectedMonth,
    total_spent: Math.round(totalSpent),
    tx_count: monthTransactions.length,
    budget: budget,
    remaining_budget: Math.round(budget - totalSpent),
    category_breakdown: categoryBreakdown,
    chart_data: chartData,
    payment_breakdown: paymentBreakdown,
    monthly_trend: monthlyTrend
  };
}

/**
 * Calculate Annual / Yearly Reports metrics from transactions list
 */
export function computeYearlyReportFromTransactions(transactions = [], selectedYear = new Date().getFullYear().toString(), categoryMeta = []) {
  const yearStr = String(selectedYear);

  // Filter transactions for selected year
  const yearTransactions = transactions.filter(t => {
    const d = t.date || t.month_key || '';
    return d.startsWith(yearStr);
  });

  let totalSpent = 0;
  const monthMap = {};
  const categoryMap = {};
  const paymentMap = {};

  const monthNames = [
    { key: '01', label: 'Jan' }, { key: '02', label: 'Feb' }, { key: '03', label: 'Mar' },
    { key: '04', label: 'Apr' }, { key: '05', label: 'May' }, { key: '06', label: 'Jun' },
    { key: '07', label: 'Jul' }, { key: '08', label: 'Aug' }, { key: '09', label: 'Sep' },
    { key: '10', label: 'Oct' }, { key: '11', label: 'Nov' }, { key: '12', label: 'Dec' }
  ];

  monthNames.forEach(m => {
    monthMap[m.key] = { label: m.label, total: 0, count: 0 };
  });

  yearTransactions.forEach(t => {
    let amt = parseFloat(t.amount) || 0;
    if (t.is_refund && amt > 0) amt = -amt;
    totalSpent += amt;

    const mKey = (t.date ? t.date.slice(5, 7) : (t.month_key ? t.month_key.slice(5, 7) : '01'));
    if (monthMap[mKey]) {
      monthMap[mKey].total += amt;
      monthMap[mKey].count += 1;
    }

    const cat = t.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += amt;
    categoryMap[cat].count += 1;

    const pm = t.payment_mode || 'UPI';
    if (!paymentMap[pm]) paymentMap[pm] = { total: 0, count: 0 };
    paymentMap[pm].total += amt;
    paymentMap[pm].count += 1;
  });

  // Calculate highest spending month
  let maxMonthTotal = 1;
  let highestMonth = { label: 'None', total: 0 };
  monthNames.forEach(m => {
    const tot = monthMap[m.key].total;
    if (tot > maxMonthTotal) maxMonthTotal = tot;
    if (tot > highestMonth.total) highestMonth = { label: m.label, total: Math.round(tot) };
  });

  const monthsData = monthNames.map(m => {
    const tot = Math.round(monthMap[m.key].total);
    const heightPercent = maxMonthTotal > 0 ? Math.max(0, Math.round((tot / maxMonthTotal) * 100)) : 0;
    return {
      month_key: `${yearStr}-${m.key}`,
      label: m.label,
      total: tot,
      count: monthMap[m.key].count,
      height_percent: heightPercent
    };
  });

  const categoryBreakdown = Object.keys(categoryMap).map(catName => {
    const cat = categoryMap[catName];
    const meta = categoryMeta.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const pct = totalSpent > 0 ? Math.round((cat.total / totalSpent) * 1000) / 10 : 0;
    return {
      category: catName,
      total: Math.round(cat.total),
      tx_count: cat.count,
      percentage: Math.max(0, pct),
      icon: meta?.icon || 'Tag',
      color: meta?.color || '#6C47FF'
    };
  }).sort((a, b) => b.total - a.total);

  const paymentBreakdown = Object.keys(paymentMap).map(pm => {
    const p = paymentMap[pm];
    const pct = totalSpent > 0 ? Math.round((p.total / totalSpent) * 1000) / 10 : 0;
    return {
      payment_mode: pm,
      total: Math.round(p.total),
      tx_count: p.count,
      percentage: Math.max(0, pct)
    };
  }).sort((a, b) => b.total - a.total);

  // Available unique years from all transactions
  const yearsSet = new Set();
  transactions.forEach(t => {
    const y = (t.date || t.month_key || '').slice(0, 4);
    if (y && y.match(/^\d{4}$/)) yearsSet.add(y);
  });
  if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear().toString());
  const availableYears = Array.from(yearsSet).sort().reverse();

  return {
    year: yearStr,
    total_spent: Math.round(totalSpent),
    tx_count: yearTransactions.length,
    monthly_average: Math.round(totalSpent / 12),
    highest_month: highestMonth,
    months_data: monthsData,
    category_breakdown: categoryBreakdown,
    payment_breakdown: paymentBreakdown,
    available_years: availableYears
  };
}
