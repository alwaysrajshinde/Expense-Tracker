/**
 * Dedicated Bank Statement Recognition & Statement Reconciliation Engine
 */

export const SUPPORTED_BANKS = [
  { id: 'sbi', name: 'State Bank of India (SBI)', code: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
  { id: 'generic', name: 'Generic / Other Bank', code: 'GENERIC' }
];

/**
 * Detects the bank from document headers, filename, or text signature
 */
export function detectBankSignature(filename = '', headers = [], sampleRows = []) {
  const fileLower = filename.toLowerCase();
  const headerStr = headers.join(' ').toLowerCase();
  const sampleStr = sampleRows.map(r => (Array.isArray(r) ? r.join(' ') : '')).join(' ').toLowerCase();
  const combined = `${fileLower} ${headerStr} ${sampleStr}`;

  // 1. SBI Signature
  if (
    combined.includes('state bank of india') || 
    fileLower.includes('sbi') || 
    (headerStr.includes('txn date') && headerStr.includes('ref no./cheque no.'))
  ) {
    return {
      bank: 'State Bank of India (SBI)',
      id: 'sbi',
      confidence: 'high',
      suggestedMapping: {
        date: findHeader(headers, ['txn date', 'date', 'value date']),
        description: findHeader(headers, ['description', 'narration', 'particulars']),
        debit: findHeader(headers, ['debit', 'dr']),
        credit: findHeader(headers, ['credit', 'cr']),
        reference_id: findHeader(headers, ['ref no./cheque no.', 'ref no', 'cheque no']),
        balance: findHeader(headers, ['balance', 'bal'])
      }
    };
  }

  // 2. HDFC Bank Signature
  if (
    combined.includes('hdfc bank') || 
    fileLower.includes('hdfc') || 
    (headerStr.includes('narration') && headerStr.includes('chq/ref no') && headerStr.includes('withdrawal amt.'))
  ) {
    return {
      bank: 'HDFC Bank',
      id: 'hdfc',
      confidence: 'high',
      suggestedMapping: {
        date: findHeader(headers, ['date', 'value dt']),
        description: findHeader(headers, ['narration', 'particulars']),
        debit: findHeader(headers, ['withdrawal amt.', 'withdrawal amt', 'debit']),
        credit: findHeader(headers, ['deposit amt.', 'deposit amt', 'credit']),
        reference_id: findHeader(headers, ['chq/ref no', 'ref no']),
        balance: findHeader(headers, ['closing balance', 'balance'])
      }
    };
  }

  // 3. ICICI Bank Signature
  if (
    combined.includes('icici bank') || 
    fileLower.includes('optransactionhistory') || 
    fileLower.includes('icici') || 
    (headerStr.includes('transaction remarks') && headerStr.includes('withdrawal amount (inr )'))
  ) {
    return {
      bank: 'ICICI Bank',
      id: 'icici',
      confidence: 'high',
      suggestedMapping: {
        date: findHeader(headers, ['transaction date', 'value date', 'date']),
        description: findHeader(headers, ['transaction remarks', 'remarks', 'particulars']),
        debit: findHeader(headers, ['withdrawal amount (inr )', 'withdrawal amount', 'debit']),
        credit: findHeader(headers, ['deposit amount (inr )', 'deposit amount', 'credit']),
        reference_id: findHeader(headers, ['cheque number', 'ref no']),
        balance: findHeader(headers, ['balance (inr )', 'balance'])
      }
    };
  }

  // 4. Axis Bank Signature
  if (
    combined.includes('axis bank') || 
    fileLower.includes('axis') || 
    (headerStr.includes('tran date') && headerStr.includes('chqno') && headerStr.includes('particulars'))
  ) {
    return {
      bank: 'Axis Bank',
      id: 'axis',
      confidence: 'high',
      suggestedMapping: {
        date: findHeader(headers, ['tran date', 'date']),
        description: findHeader(headers, ['particulars', 'description']),
        debit: findHeader(headers, ['dr', 'debit']),
        credit: findHeader(headers, ['cr', 'credit']),
        reference_id: findHeader(headers, ['chqno', 'ref no']),
        balance: findHeader(headers, ['bal', 'balance'])
      }
    };
  }

  // 5. Kotak Mahindra Bank Signature
  if (
    combined.includes('kotak') || 
    fileLower.includes('kotak') || 
    (headerStr.includes('chq / ref no.') && headerStr.includes('dr / cr'))
  ) {
    return {
      bank: 'Kotak Mahindra Bank',
      id: 'kotak',
      confidence: 'high',
      suggestedMapping: {
        date: findHeader(headers, ['transaction date', 'date', 'value date']),
        description: findHeader(headers, ['description', 'particulars']),
        debit: findHeader(headers, ['debit', 'dr']),
        credit: findHeader(headers, ['credit', 'cr']),
        reference_id: findHeader(headers, ['chq / ref no.', 'ref no']),
        balance: findHeader(headers, ['balance'])
      }
    };
  }

  return {
    bank: 'Generic Statement / Standard File',
    id: 'generic',
    confidence: 'low',
    suggestedMapping: null
  };
}

/**
 * Reconciles the statement arithmetic: Opening Balance + Total Credits - Total Debits = Closing Balance
 */
export function reconcileStatementArithmetic(transactions = []) {
  if (!transactions || transactions.length === 0) {
    return { reconciled: false, reason: 'No transactions to reconcile' };
  }

  let totalDebits = 0;
  let totalCredits = 0;
  let openingBalance = null;
  let closingBalance = null;

  // Extract balances if available
  const sorted = [...transactions].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  sorted.forEach((tx, idx) => {
    const d = parseFloat(tx.debit_amount) || 0;
    const c = parseFloat(tx.credit_amount) || 0;
    totalDebits += d;
    totalCredits += c;

    if (tx.running_balance !== undefined && tx.running_balance !== null && !isNaN(tx.running_balance)) {
      if (openingBalance === null && idx === 0) {
        // First row running balance adjusted for first transaction
        openingBalance = tx.running_balance + d - c;
      }
      closingBalance = tx.running_balance;
    }
  });

  if (openingBalance !== null && closingBalance !== null) {
    const expectedClosing = openingBalance + totalCredits - totalDebits;
    const diff = Math.abs(expectedClosing - closingBalance);
    const isReconciled = diff < 1.0; // Allow 1 rupee rounding difference

    return {
      reconciled: isReconciled,
      hasBalances: true,
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      difference: Math.round(diff * 100) / 100
    };
  }

  return {
    reconciled: null, // Balances not provided in file
    hasBalances: false,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100
  };
}

function findHeader(headers, candidates) {
  for (const c of candidates) {
    const found = headers.find(h => h.trim().toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  for (const c of candidates) {
    const found = headers.find(h => h.trim().toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return '';
}
