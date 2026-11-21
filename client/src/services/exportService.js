import * as XLSX from 'xlsx';

/**
 * Universal Client-Side Export Service for GitHub Pages
 * Generates and downloads Excel (.xlsx), CSV, and JSON files directly in the browser.
 */

export function exportTransactionsToExcel(transactions = [], filename = 'Daily_Expenses_Export.xlsx') {
  const rows = transactions.map((t, idx) => ({
    'Sr No': idx + 1,
    'Date': t.date || '',
    'Category': t.category || '',
    'Payment Mode': t.payment_mode || '',
    'Description': t.description || '',
    'Amount (₹)': parseFloat(t.amount) || 0,
    'Type': (t.is_refund || t.amount < 0) ? 'Refund / Return' : 'Expense'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set standard column widths for clean readability
  worksheet['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 14 }, // Date
    { wch: 20 }, // Category
    { wch: 16 }, // Payment Mode
    { wch: 32 }, // Description
    { wch: 14 }, // Amount
    { wch: 18 }  // Type
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportTransactionsToCsv(transactions = [], filename = 'Daily_Expenses_Export.csv') {
  const rows = transactions.map((t, idx) => ({
    'Sr No': idx + 1,
    'Date': t.date || '',
    'Category': t.category || '',
    'Payment Mode': t.payment_mode || '',
    'Description': t.description || '',
    'Amount': parseFloat(t.amount) || 0,
    'Type': (t.is_refund || t.amount < 0) ? 'Refund' : 'Expense'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDataToJson(data, filename = 'expense_tracker_backup.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
