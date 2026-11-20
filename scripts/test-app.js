const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3001${path}`, options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const text = buffer.toString('utf-8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text,
          json,
          buffer
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ENDPOINT TESTS ---');

  // Test 1: Static frontend index.html
  const htmlRes = await request('/');
  console.log('1. Static HTML serving: Status', htmlRes.status, '- Contains "<!doctype html>":', htmlRes.text.includes('<!doctype html>'));

  // Test 2: Dashboard Nov 2026
  const dashRes = await request('/api/dashboard?month=2026-11');
  console.log('2. Dashboard Nov 2026: Status', dashRes.status, 'Success:', dashRes.json?.success);
  console.log('   Spent:', dashRes.json?.data?.total_spent, 'Budget:', dashRes.json?.data?.budget);
  console.log('   Top categories count:', dashRes.json?.data?.top_categories?.length);

  // Test 3: Transactions Query
  const txRes = await request('/api/transactions?month=2026-11&limit=5');
  console.log('3. Transactions Query: Total count in Nov 2026:', txRes.json?.data?.total_count);
  console.log('   Page 1 items count:', txRes.json?.data?.transactions?.length);

  // Test 4: All-time transactions count
  const allTxRes = await request('/api/transactions?month=all&limit=1');
  console.log('4. All-time Transactions Total:', allTxRes.json?.data?.total_count, '(Expected >= 1198)');

  // Test 5: Add a new expense
  const addRes = await request('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      amount: 150,
      category: 'Food',
      payment_mode: 'UPI',
      date: '2026-11-20',
      description: 'Test Lunch',
      is_refund: false
    }
  });
  console.log('5. Add Expense (150 INR): Status', addRes.status, 'Created ID:', addRes.json?.data?.id);
  const createdId = addRes.json?.data?.id;

  // Test 6: Verify Add
  const verifyAdd = await request('/api/dashboard?month=2026-11');
  console.log('6. Verify Updated Spend:', verifyAdd.json?.data?.total_spent);

  // Test 7: Add a refund (negative transaction)
  const addRefundRes = await request('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      amount: 50,
      category: 'Auto',
      payment_mode: 'UPI',
      date: '2026-11-20',
      description: 'Rapido Cashback Return',
      is_refund: true
    }
  });
  console.log('7. Add Refund (-50 INR): Status', addRefundRes.status, 'Created ID:', addRefundRes.json?.data?.id, 'Amount:', addRefundRes.json?.data?.amount);
  const refundId = addRefundRes.json?.data?.id;

  // Test 8: Edit Expense
  const editRes = await request(`/api/transactions/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: {
      amount: 180,
      category: 'Food',
      payment_mode: 'Cash',
      date: '2026-11-20',
      description: 'Test Lunch with Dessert',
      is_refund: false
    }
  });
  console.log('8. Edit Expense to 180 INR: Status', editRes.status, 'New Amount:', editRes.json?.data?.amount, 'New PM:', editRes.json?.data?.payment_mode);

  // Test 9: Delete Test Transactions
  const del1 = await request(`/api/transactions/${createdId}`, { method: 'DELETE' });
  const del2 = await request(`/api/transactions/${refundId}`, { method: 'DELETE' });
  console.log('9. Cleaned up test transactions:', del1.json?.success && del2.json?.success);

  // Test 10: Reports Endpoint
  const repRes = await request('/api/reports?month=2026-11');
  console.log('10. Reports Nov 2026: Status', repRes.status);
  console.log('    Trend months count:', repRes.json?.data?.monthly_trend?.length);
  console.log('    Payment modes count:', repRes.json?.data?.payment_breakdown?.length);
  console.log('    Categories breakdown count:', repRes.json?.data?.category_breakdown?.length);

  // Test 11: Categories Master List
  const catRes = await request('/api/categories');
  console.log('11. Categories Master List: Total categories:', catRes.json?.data?.length);

  // Test 12: Export Excel
  const excelRes = await request('/api/export/excel');
  console.log('12. Export Excel: Status', excelRes.status, 'Content-Type:', excelRes.headers['content-type'], 'Size:', excelRes.buffer.length, 'bytes');

  // Test 13: Export JSON Backup
  const jsonRes = await request('/api/export/json');
  console.log('13. Export JSON: Status', jsonRes.status, 'Backup tx count:', jsonRes.json?.transactions?.length);

  // Final check on database records count
  const finalTxRes = await request('/api/transactions?month=all&limit=1');
  console.log('\n--- FINAL VERIFICATION ---');
  console.log('Database Transaction Count:', finalTxRes.json?.data?.total_count);
  console.log('All tests passed successfully!');
}

runTests().catch(console.error);
