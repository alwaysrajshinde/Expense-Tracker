/**
 * Reusable Test Data Generators for Playwright Automation
 */

function generateUniqueUser(prefix = 'qa_user') {
  const timestamp = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return {
    email: `${prefix}_${timestamp}_${rand}@example.com`,
    name: `QA User ${rand}`,
    sub: `google_qa_${timestamp}_${rand}`
  };
}

const SAMPLE_EXPENSES = {
  standard: {
    amount: '350',
    category: 'Food',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Fresh lunch at bistro',
    is_refund: false
  },
  decimal: {
    amount: '149.99',
    category: 'Groceries',
    payment_mode: 'Credit Card',
    date: '2026-11-20',
    description: 'Grocery bill with decimal value',
    is_refund: false
  },
  largeAmount: {
    amount: '999999',
    category: 'Shopping',
    payment_mode: 'Net Banking',
    date: '2026-11-19',
    description: 'High-value equipment purchase',
    is_refund: false
  },
  specialChars: {
    amount: '220',
    category: 'Auto',
    payment_mode: 'Cash',
    date: '2026-11-20',
    description: 'Auto fare & toll: <test> "quotes" & ₹ symbol / special @#$',
    is_refund: false
  },
  refund: {
    amount: '500',
    category: 'Shopping',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Item return & refund',
    is_refund: true
  },
  monthBoundary: {
    amount: '120',
    category: 'Metro',
    payment_mode: 'UPI',
    date: '2026-11-01',
    description: 'First day of month commute',
    is_refund: false
  }
};

const INVALID_EXPENSES = {
  zeroAmount: {
    amount: '0',
    category: 'Food',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Zero amount expense'
  },
  negativeAmount: {
    amount: '-150',
    category: 'Food',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Negative amount directly entered'
  },
  emptyAmount: {
    amount: '',
    category: 'Food',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Missing amount field'
  },
  nonNumeric: {
    amount: 'abcxyz',
    category: 'Food',
    payment_mode: 'UPI',
    date: '2026-11-20',
    description: 'Invalid text amount'
  }
};

module.exports = {
  generateUniqueUser,
  SAMPLE_EXPENSES,
  INVALID_EXPENSES
};
