const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['Expenses'];
const rows = xlsx.utils.sheet_to_json(sheet);

const validRows = rows.filter(r => r.Date && r.Amount !== undefined && r.Amount !== null && r.Amount !== '');
console.log('Valid rows count:', validRows.length);

const seen = new Map();
let duplicateCount = 0;
const duplicates = [];

validRows.forEach((r, idx) => {
  const d = xlsx.SSF.parse_date_code(r.Date);
  const dateStr = d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : r.Date;
  const key = `${dateStr}|${String(r.Description).trim()}|${String(r.Category).trim()}|${String(r['Payment Mode']).trim()}|${r.Amount}`;
  if (seen.has(key)) {
    duplicateCount++;
    duplicates.push({ rowIdx: idx + 2, firstSeen: seen.get(key), data: r });
  } else {
    seen.set(key, idx + 2);
  }
});

console.log(`Duplicate entries detected (same date, desc, cat, payment, amount): ${duplicateCount}`);
if (duplicates.length > 0) {
  console.log('Sample duplicates:', duplicates.slice(0, 5));
}
