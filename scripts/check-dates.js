const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath, { cellDates: true });
const sheet = workbook.Sheets['Expenses'];
const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

let validCount = 0;
let dateErrors = 0;
const datesParsed = [];

rows.forEach((r, idx) => {
  if (!r.Date || r.Amount === undefined || r.Amount === '') return;
  validCount++;
  const dVal = r.Date;
  // Test if it parses as valid date
  const d = new Date(dVal);
  if (isNaN(d.getTime())) {
    dateErrors++;
    console.log(`Row ${idx} date error:`, dVal);
  } else {
    datesParsed.push({
      original: dVal,
      iso: d.toISOString().split('T')[0],
      monthKey: r.Month_Key,
      calcMonthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    });
  }
});

console.log(`Valid count: ${validCount}, Date errors: ${dateErrors}`);
console.log('Sample parsed dates:', datesParsed.slice(0, 5));
console.log('Sample parsed dates (middle):', datesParsed.slice(500, 505));
console.log('Sample parsed dates (last):', datesParsed.slice(-5));

// Check any mismatch between calcMonthKey and r.Month_Key
const mismatches = datesParsed.filter(p => p.monthKey && p.monthKey !== p.calcMonthKey);
console.log(`Month key mismatches: ${mismatches.length}`);
if (mismatches.length > 0) {
  console.log('Sample mismatches:', mismatches.slice(0, 5));
}
