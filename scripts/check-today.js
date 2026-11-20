const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath, { raw: true });
const sheet = workbook.Sheets['Expenses'];
const rows = xlsx.utils.sheet_to_json(sheet);

const nov20 = rows.filter(r => String(r.Date).includes('20-Nov') || String(r.Date) === '46345');
console.log('Nov 20 entries:', nov20);

// Check dates format in raw mode
const dateTypes = {};
rows.slice(0, 100).forEach(r => {
  const t = typeof r.Date;
  dateTypes[t] = (dateTypes[t] || 0) + 1;
});
console.log('Date types in first 100 rows:', dateTypes);
console.log('First 5 raw rows:', rows.slice(0, 5));
