const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath);

// Check sheet 'Categories'
const catSheet = workbook.Sheets['Categories'];
const catSheetData = xlsx.utils.sheet_to_json(catSheet, { header: 1 });
const catSheetItems = new Set();
// First row header was 'Non Veg' which might be an item itself
if (catSheet['A1']) catSheetItems.add(String(catSheet['A1'].v).trim());
catSheetData.forEach(row => {
  if (row[0]) catSheetItems.add(String(row[0]).trim());
});

console.log('Categories from Categories sheet:', catSheetItems.size);

// Check sheet 'Expenses'
const expSheet = workbook.Sheets['Expenses'];
const expData = xlsx.utils.sheet_to_json(expSheet);
const expCategories = new Set();
const expCatTrimmed = new Map(); // trimmed -> array of original

expData.forEach(r => {
  if (r.Category) {
    const orig = String(r.Category);
    const tr = orig.trim();
    expCategories.add(tr);
    if (!expCatTrimmed.has(tr)) expCatTrimmed.set(tr, new Set());
    expCatTrimmed.get(tr).add(orig);
  }
});

console.log('Unique trimmed categories in Expenses sheet:', expCategories.size);
for (const [tr, origs] of expCatTrimmed.entries()) {
  if (origs.size > 1 || Array.from(origs)[0] !== tr) {
    console.log(`Whitespace variation for "${tr}":`, Array.from(origs));
  }
}

// Find any in catSheet not in expCategories
const notInExpenses = [...catSheetItems].filter(c => !expCategories.has(c));
console.log('Categories in master sheet but not in Expenses sheet:', notInExpenses);

// Find any in expCategories not in catSheet
const notInCatSheet = [...expCategories].filter(c => !catSheetItems.has(c));
console.log('Categories in Expenses sheet but not in master sheet:', notInCatSheet);
