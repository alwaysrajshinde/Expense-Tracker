const http = require('http');

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verifyMultiUserBackend() {
  console.log('--- Verifying Multi-User Backend Data Isolation ---');

  // Reset test users so Alice & Bob are tested cleanly from scratch
  try {
    const db = require('../server/db');
    db.db.prepare('DELETE FROM transactions WHERE user_id > 1').run();
    db.db.prepare('DELETE FROM user_spreadsheet_mappings WHERE user_id > 1').run();
    db.db.prepare('DELETE FROM users WHERE id > 1').run();
  } catch (cleanErr) {}

  // 1. Raj Shinde (Existing account)
  console.log('\n[Scenario 1] Raj Shinde logs in...');
  const rajAuth = await postJson('http://localhost:3001/api/auth/google', {
    email: 'raaajshinde@gmail.com',
    name: 'Raj Shinde',
    sub: 'raj_shinde_master_sub'
  });
  console.log('  Raj Auth Status:', rajAuth.status, rajAuth.body.user.email);
  console.log('  Raj Spreadsheet Mapping:', rajAuth.body.spreadsheet.spreadsheet_id, rajAuth.body.spreadsheet.status);

  const rajDash = await getJson('http://localhost:3001/api/dashboard?month=2026-11', {
    'x-user-email': 'raaajshinde@gmail.com'
  });
  console.log('  Raj November Spent:', rajDash.body.data.total_spent, 'Budget:', rajDash.body.data.budget);
  console.log('  Raj Transactions Count:', rajDash.body.data.tx_count);

  const rajTxs = await getJson('http://localhost:3001/api/transactions?month=all', {
    'x-user-email': 'raaajshinde@gmail.com'
  });
  console.log('  Raj Total Historical Transactions:', rajTxs.body.data.pagination.total);
  if (rajTxs.body.data.pagination.total < 1198) {
    throw new Error('Historical transactions lost for Raj!');
  }

  // 2. New User A (Alice)
  console.log('\n[Scenario 2] New User A (Alice) logs in for first time...');
  const aliceAuth = await postJson('http://localhost:3001/api/auth/google', {
    email: 'alice@example.com',
    name: 'Alice Johnson',
    sub: 'google_sub_alice_12345'
  });
  console.log('  Alice Auth:', aliceAuth.body.user.email, 'is_new_user:', aliceAuth.body.is_new_user);
  console.log('  Alice Generated Spreadsheet ID:', aliceAuth.body.spreadsheet.spreadsheet_id);

  const aliceDash = await getJson('http://localhost:3001/api/dashboard?month=2026-11', {
    'x-user-email': 'alice@example.com'
  });
  console.log('  Alice Initial November Spent:', aliceDash.body.data.total_spent);
  console.log('  Alice Initial Remaining Budget:', aliceDash.body.data.remaining_budget);
  console.log('  Alice Initial Tx Count:', aliceDash.body.data.tx_count);

  if (aliceDash.body.data.tx_count !== 0 || aliceDash.body.data.total_spent !== 0) {
    throw new Error('Data leakage! Alice must start with 0 transactions and 0 spent');
  }

  // 3. Alice adds an expense
  console.log('\n[Scenario 3] Alice adds her first expense of ₹450...');
  const addAliceTx = await postJson('http://localhost:3001/api/transactions', {
    amount: 450,
    category: 'Groceries',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Weekly Organic Vegetables'
  }, {
    'x-user-email': 'alice@example.com'
  });
  console.log('  Alice Added Tx ID:', addAliceTx.body.data.id, 'Amount:', addAliceTx.body.data.amount);

  // 4. Verify Alice sees her 1 expense
  const aliceDashAfter = await getJson('http://localhost:3001/api/dashboard?month=2026-11', {
    'x-user-email': 'alice@example.com'
  });
  console.log('  Alice Updated Spent:', aliceDashAfter.body.data.total_spent, 'Count:', aliceDashAfter.body.data.tx_count);
  if (aliceDashAfter.body.data.total_spent !== 450 || aliceDashAfter.body.data.tx_count !== 1) {
    throw new Error('Alice dashboard calculation mismatch!');
  }

  // 5. Verify Raj's data is 100% UNCHANGED
  console.log('\n[Scenario 4] Verifying Raj data isolation...');
  const rajDashAfter = await getJson('http://localhost:3001/api/dashboard?month=2026-11', {
    'x-user-email': 'raaajshinde@gmail.com'
  });
  if (rajDashAfter.body.data.total_spent !== rajDash.body.data.total_spent) {
    throw new Error('Data contamination! Raj spent changed after Alice added an expense');
  }
  console.log('✓ Raj historical records completely untouched and isolated!');

  // 6. New User B (Bob)
  console.log('\n[Scenario 5] New User B (Bob) logs in...');
  const bobAuth = await postJson('http://localhost:3001/api/auth/google', {
    email: 'bob@example.com',
    name: 'Bob Smith',
    sub: 'google_sub_bob_98765'
  });
  console.log('  Bob Spreadsheet ID:', bobAuth.body.spreadsheet.spreadsheet_id);

  const bobDash = await getJson('http://localhost:3001/api/dashboard?month=2026-11', {
    'x-user-email': 'bob@example.com'
  });
  console.log('  Bob Spent:', bobDash.body.data.total_spent, 'Count:', bobDash.body.data.tx_count);

  if (bobDash.body.data.tx_count !== 0) {
    throw new Error('Bob must start with 0 transactions!');
  }

  // 7. Test re-login does NOT create duplicate spreadsheets
  console.log('\n[Scenario 6] Testing repeated login for Alice...');
  const aliceReAuth = await postJson('http://localhost:3001/api/auth/google', {
    email: 'alice@example.com',
    name: 'Alice Johnson',
    sub: 'google_sub_alice_12345'
  });
  console.log('  Alice Re-login Spreadsheet ID:', aliceReAuth.body.spreadsheet.spreadsheet_id);
  if (aliceReAuth.body.spreadsheet.spreadsheet_id !== aliceAuth.body.spreadsheet.spreadsheet_id) {
    throw new Error('Duplicate spreadsheet created on re-login!');
  }
  console.log('✓ Re-login retains exact same spreadsheet association without duplicates!');

  console.log('\n🎉 ALL MULTI-USER BACKEND TESTS PASSED WITH 100% ISOLATION!\n');
}

verifyMultiUserBackend().catch(err => {
  console.error(err);
  process.exit(1);
});
