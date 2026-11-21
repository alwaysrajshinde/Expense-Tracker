import assert from 'assert';

import { classifyNarration, extractCleanMerchant } from '../client/src/services/import/narrationClassifier.js';
import { detectBankSignature, reconcileStatementArithmetic } from '../client/src/services/import/bankStatementDetector.js';
import { detectDuplicates } from '../client/src/services/import/duplicateDetector.js';

console.log('--- Testing Narration Classifier ---');
const u1 = classifyNarration('UPI/432109876543/SWIGGY/swiggy@icici/Order123', 450, false);
assert.strictEqual(u1.cleanDescription, 'Swiggy', 'Should extract Swiggy');
assert.strictEqual(u1.category, 'Food & Dining', 'Should categorize as Food & Dining');
assert.strictEqual(u1.paymentMode, 'UPI', 'Should detect UPI payment mode');
assert.strictEqual(u1.type, 'expense', 'Should be expense');

const u2 = classifyNarration('ACH/SALARY/ACME CORP NOV 2026', 65000, true);
assert.strictEqual(u2.type, 'income', 'Credit salary should be income');
assert.strictEqual(u2.category, 'Salary', 'Should categorize as Salary');

const u3 = classifyNarration('UPI/998877665544/TRANSFER TO SELF/raj@okhdfc', 5000, false);
assert.strictEqual(u3.isTransfer, true, 'Self transfer should be marked as transfer');
assert.strictEqual(u3.type, 'transfer', 'Should have type transfer');

const u4 = classifyNarration('POS 402213XXXXXX1234 RELIANCE SMART BANDRA', 1200, false);
assert.strictEqual(u4.category, 'Groceries', 'Reliance Smart should be Groceries');
assert.strictEqual(u4.paymentMode, 'Debit Card', 'POS should detect Debit Card');

console.log('✓ Narration Classifier: All tests passed!');

console.log('--- Testing Bank Statement Detector & Reconciler ---');
const sbiHeaders = ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'];
const detectedBank = detectBankSignature('sbi_statement_nov.xlsx', sbiHeaders, []);
assert.ok(detectedBank, 'Should detect bank statement');
assert.strictEqual(detectedBank.id, 'sbi', 'Should recognize SBI format');

// Test arithmetic reconciliation
const parsedTxs = [
  { date: '2026-11-01', debit_amount: 500, credit_amount: 0, running_balance: 9500 },
  { date: '2026-11-02', debit_amount: 0, credit_amount: 10000, running_balance: 19500 }
];
// In parsedTxs:
// First row running balance: 9500. Debit: 500. Opening balance = 9500 + 500 = 10000.
// Second row running balance: 19500. Credit: 10000.
// Expected closing: 10000 + 10000 - 500 = 19500. Diff = 0.
const recon = reconcileStatementArithmetic(parsedTxs);
assert.strictEqual(recon.hasBalances, true, 'Should have balances');
assert.strictEqual(recon.reconciled, true, 'Should balance mathematically');
assert.strictEqual(recon.difference, 0, 'Discrepancy should be 0');

console.log('✓ Bank Statement Detector & Reconciler: All tests passed!');

console.log('--- Testing Duplicate Detector ---');
const existingTxs = [
  { id: 'tx_1', date: '2026-11-15', amount: 450, description: 'SWIGGY', reference_id: 'UPI432109876543' },
  { id: 'tx_2', date: '2026-11-16', amount: 1250, description: 'RELIANCE FRESH', payment_mode: 'Debit Card' }
];

const newTxs = [
  // Exact duplicate via reference_id
  { date: '2026-11-15', amount: 450, description: 'Swiggy Food Order', reference_id: 'UPI432109876543' },
  // Fuzzy duplicate: same amount, similar description, date within 1 day
  { date: '2026-11-16', amount: 1250, description: 'RELIANCE FRESH MUMBAI' },
  // Completely unique transaction
  { date: '2026-11-20', amount: 999, description: 'NETFLIX SUBSCRIPTION' }
];

const evaluated = detectDuplicates(newTxs, existingTxs);
assert.strictEqual(evaluated[0].duplicateStatus, 'confirmed_duplicate', 'First item should be flagged as exact duplicate');
assert.strictEqual(evaluated[1].duplicateStatus, 'possible_duplicate', 'Second item should be flagged as possible duplicate');
assert.strictEqual(evaluated[2].duplicateStatus, 'unique', 'Third item should be flagged as unique');

console.log('✓ Duplicate Detector: All tests passed!');

console.log('\n==========================================');
console.log('ALL INTELLIGENT IMPORT ALGORITHMS PASSED!');
console.log('==========================================');
