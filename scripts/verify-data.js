const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath, { cellDates: false });

const sheet = workbook.Sheets['Expenses'];
const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });

console.log('Total raw rows parsed:', rawData.length);

const validRows = rawData.filter(r => r.Date && r.Amount !== null && r.Amount !== undefined && r.Amount !== '');
console.log('Valid transaction rows:', validRows.length);

// Check November 2026
const novRows = validRows.filter(r => r.Month_Key === '2026-11');
console.log('Nov 2026 transactions count:', novRows.length);

let novTotal = 0;
const catMap = {};
novRows.forEach(r => {
  const amt = parseFloat(r.Amount);
  novTotal += amt;
  const cat = r.Category || 'Unknown';
  catMap[cat] = (catMap[cat] || 0) + amt;
});
console.log('Nov 2026 total spend:', novTotal);

const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
console.log('Nov 2026 Top Categories:');
sortedCats.slice(0, 10).forEach(([cat, amt]) => {
  console.log(`  ${cat}: ₹${amt} (${((amt / novTotal) * 100).toFixed(1)}%)`);
});

// Check by Month
const monthSummary = {};
validRows.forEach(r => {
  const mk = r.Month_Key || 'Unknown';
  if (!monthSummary[mk]) monthSummary[mk] = { count: 0, total: 0 };
  const amt = parseFloat(r.Amount);
  monthSummary[mk].count++;
  monthSummary[mk].total += amt;
});

console.log('\nMonthly Breakdown:');
Object.keys(monthSummary).sort().forEach(mk => {
  console.log(`  ${mk}: ${monthSummary[mk].count} txns, ₹${monthSummary[mk].total.toFixed(2)}`);
});

// Check negative transactions
const negativeRows = validRows.filter(r => parseFloat(r.Amount) < 0);
console.log('\nNegative transactions (Refunds/Returns):', negativeRows);

// Check Categories sheet
const catSheet = workbook.Sheets['Categories'];
if (catSheet) {
  const catData = xlsx.utils.sheet_to_json(catSheet, { header: 1 });
  console.log('\nCategories sheet raw data count:', catData.length);
  const allMasterCats = catData.flat().filter(Boolean);
  console.log('Categories sheet list count:', allMasterCats.length);
}
