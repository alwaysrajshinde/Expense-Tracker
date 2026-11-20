const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Daily Expense.xlsx');
const workbook = xlsx.readFile(filePath, { cellDates: true });

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Sheet "${sheetName}": ${data.length} rows, first row (headers):`, data[0]);
});

// Let's inspect the main sheet (probably "Daily Expense" or similar)
for (const sheetName of workbook.SheetNames) {
  if (['Mavshi', 'Mobiles EMI', '2025', 'Cooler'].includes(sheetName)) {
    console.log(`Skipping excluded sheet: ${sheetName}`);
    continue;
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });
  console.log(`\n--- Sheet "${sheetName}" Details ---`);
  console.log(`Total data rows: ${rows.length}`);
  if (rows.length > 0) {
    console.log('Sample row (first):', rows[0]);
    console.log('Sample row (last):', rows[rows.length - 1]);
    
    // Check columns
    const keys = Object.keys(rows[0] || {});
    console.log('Columns detected:', keys);

    // Categories
    const categories = new Set();
    const paymentModes = new Set();
    let totalAmount = 0;
    let negativeCount = 0;
    let negativeTotal = 0;
    let positiveCount = 0;
    let positiveTotal = 0;
    const months = new Set();

    rows.forEach((r, idx) => {
      // Find category, amount, payment mode, date, month_key
      const cat = r['Category'] || r['category'];
      if (cat) categories.add(String(cat).trim());
      
      const pm = r['Payment Mode'] || r['payment_mode'] || r['PaymentMode'];
      if (pm) paymentModes.add(String(pm).trim());
      
      const amtStr = r['Amount'] || r['amount'];
      const amt = parseFloat(amtStr);
      if (!isNaN(amt)) {
        totalAmount += amt;
        if (amt < 0) {
          negativeCount++;
          negativeTotal += amt;
        } else {
          positiveCount++;
          positiveTotal += amt;
        }
      }

      const mk = r['Month_Key'] || r['month_key'] || r['Month Key'];
      if (mk) months.add(String(mk).trim());
    });

    console.log(`Categories count: ${categories.size}`);
    console.log(`Categories list:`, Array.from(categories).sort());
    console.log(`Payment Modes:`, Array.from(paymentModes));
    console.log(`Months:`, Array.from(months).sort());
    console.log(`Total Net Amount: ${totalAmount.toFixed(2)}`);
    console.log(`Positive entries: ${positiveCount}, Total: ${positiveTotal.toFixed(2)}`);
    console.log(`Negative entries (Refunds/Returns): ${negativeCount}, Total: ${negativeTotal.toFixed(2)}`);
  }
}
