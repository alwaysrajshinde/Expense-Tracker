import { 
  collection, 
  doc, 
  writeBatch, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../firebase/config';
import { classifyNarration } from './narrationClassifier';
import * as api from '../api';

/**
 * Intelligent Data Normalization & Batch Firestore Import Service
 */

/**
 * Normalizes any date format into standard YYYY-MM-DD
 */
export function normalizeDate(val) {
  if (!val) return '';

  // 1. If Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }

  // 2. If Excel serial number (e.g. 45617)
  if (typeof val === 'number' || (!isNaN(Number(val)) && Number(val) > 20000 && Number(val) < 80000)) {
    const parsedExcel = new Date(Math.round((Number(val) - 25569) * 86400 * 1000));
    if (!isNaN(parsedExcel.getTime())) {
      return parsedExcel.toISOString().slice(0, 10);
    }
  }

  const str = String(val).trim();

  // 3. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }

  // 5. Textual months: e.g. 15-Nov-2026 or 15 Nov 2026
  const textMonthMatch = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})/);
  if (textMonthMatch) {
    const d = textMonthMatch[1].padStart(2, '0');
    const mStr = textMonthMatch[2].toLowerCase();
    let y = textMonthMatch[3];
    if (y.length === 2) y = '20' + y;
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const m = months[mStr] || '01';
    return `${y}-${m}-${d}`;
  }

  // Fallback to Date.parse
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch (e) {}

  return '';
}

/**
 * Normalizes currency and amount strings to float number
 */
export function normalizeAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.abs(val);

  // Strip currency symbols, commas, spaces, Dr/Cr text
  const cleaned = String(val)
    .replace(/[₹$€£,]/g, '')
    .replace(/Rs\.?/gi, '')
    .replace(/INR/gi, '')
    .replace(/(?:dr|cr)/gi, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Normalizes payment modes to supported standard list
 */
export function normalizePaymentMode(val) {
  if (!val) return 'UPI';
  const str = String(val).toLowerCase().trim();
  if (str.includes('upi') || str.includes('gpay') || str.includes('phonepe') || str.includes('paytm')) return 'UPI';
  if (str.includes('cash')) return 'Cash';
  if (str.includes('credit')) return 'Credit Card';
  if (str.includes('debit') || str.includes('card') || str.includes('pos')) return 'Debit Card';
  if (str.includes('net') || str.includes('neft') || str.includes('imps') || str.includes('rtgs') || str.includes('inb')) return 'Net Banking';
  if (str.includes('emi') || str.includes('ach') || str.includes('nach')) return 'EMI';
  return 'UPI';
}

/**
 * Transforms raw rows into normalized transaction candidates
 */
export function transformRowsToCandidates(rawRows = [], headers = [], mapping = {}, amountMode = 'single_amount', bankName = '') {
  const headerMap = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getVal = (row, fieldKey) => {
    const colName = mapping[fieldKey];
    if (!colName || headerMap[colName] === undefined) return '';
    const cell = row[headerMap[colName]];
    return cell !== undefined && cell !== null ? cell : '';
  };

  const candidates = [];

  rawRows.forEach((row, rowIdx) => {
    if (!Array.isArray(row)) return;

    // 1. Parse Date
    const rawDate = getVal(row, 'date');
    const cleanDate = normalizeDate(rawDate);
    if (!cleanDate) return; // Skip rows without valid date (e.g. summary or footer rows)

    // 2. Parse Amount
    let finalAmount = 0;
    let isCredit = false;
    let debitAmount = 0;
    let creditAmount = 0;

    if (amountMode === 'debit_credit') {
      const rawDebit = getVal(row, 'debit');
      const rawCredit = getVal(row, 'credit');
      debitAmount = normalizeAmount(rawDebit);
      creditAmount = normalizeAmount(rawCredit);

      if (debitAmount > 0) {
        finalAmount = debitAmount;
        isCredit = false;
      } else if (creditAmount > 0) {
        finalAmount = creditAmount;
        isCredit = true;
      } else {
        return; // Skip rows with 0 amount
      }
    } else {
      const rawAmt = getVal(row, 'amount');
      finalAmount = normalizeAmount(rawAmt);
      if (finalAmount <= 0) return;
      isCredit = String(rawAmt).includes('-') || String(rawAmt).toLowerCase().includes('cr');
    }

    // 3. Parse Narration / Description
    const rawNarration = String(getVal(row, 'description') || '').trim();
    const rawRef = String(getVal(row, 'reference_id') || '').trim();
    const rawBalance = normalizeAmount(getVal(row, 'balance'));

    // 4. Intelligent Classification
    const classification = classifyNarration(rawNarration, finalAmount, isCredit);

    // Override category / mode if explicitly mapped in file
    const explicitCat = String(getVal(row, 'category') || '').trim();
    const explicitMode = String(getVal(row, 'payment_mode') || '').trim();

    const candidate = {
      tempId: `cand_${rowIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: cleanDate,
      month_key: cleanDate.slice(0, 7),
      amount: finalAmount,
      debit_amount: debitAmount,
      credit_amount: creditAmount,
      running_balance: rawBalance > 0 ? rawBalance : null,
      description: classification.cleanDescription,
      raw_narration: classification.rawNarration || rawNarration,
      reference_id: rawRef || null,
      category: explicitCat || classification.category,
      payment_mode: explicitMode ? normalizePaymentMode(explicitMode) : classification.paymentMode,
      type: classification.type,
      is_refund: classification.isRefund,
      is_transfer: classification.isTransfer,
      bank_name: bankName || 'Generic',
      selected: true
    };

    candidates.push(candidate);
  });

  return candidates;
}

/**
 * Batched execution writing transactions to Firestore (or local API fallback)
 */
export async function executeImport(userId, approvedTransactions = [], metadata = {}) {
  if (!approvedTransactions || approvedTransactions.length === 0) {
    throw new Error('No transactions approved for import.');
  }

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const affectedMonths = new Set();
  const createdTxIds = [];
  const createdTransactions = [];

  let totalExpense = 0;
  let totalIncome = 0;

  // 1. Prepare transactions
  approvedTransactions.forEach(t => {
    affectedMonths.add(t.month_key);
    if (t.type === 'expense' && !t.is_refund && !t.is_transfer) {
      totalExpense += t.amount;
    } else if (t.type === 'income') {
      totalIncome += t.amount;
    }
  });

  // 2. Write to Firestore if configured
  if (isFirebaseConfigured && db && userId) {
    const txCol = collection(db, 'users', userId, 'transactions');
    const CHUNK_SIZE = 400; // Well below 500 limit

    for (let i = 0; i < approvedTransactions.length; i += CHUNK_SIZE) {
      const chunk = approvedTransactions.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach(t => {
        const docRef = doc(txCol);
        const txId = docRef.id;
        createdTxIds.push(txId);

        let amt = parseFloat(t.amount) || 0;
        if (t.is_refund && amt > 0) amt = -amt;

        const docData = {
          id: txId,
          user_id: userId,
          date: t.date,
          month_key: t.month_key,
          amount: amt,
          description: t.description || 'Imported Expense',
          category: t.category || 'Other',
          payment_mode: t.payment_mode || 'UPI',
          is_refund: Boolean(t.is_refund),
          type: t.type || (t.is_refund ? 'refund' : 'expense'),
          is_transfer: Boolean(t.is_transfer),
          reference_id: t.reference_id || null,
          raw_narration: t.raw_narration || '',
          bank_name: t.bank_name || metadata.bank_name || 'Generic',
          import_batch_id: batchId,
          created_at: serverTimestamp()
        };

        batch.set(docRef, docData);
        createdTransactions.push({ ...docData, id: txId });
      });

      await batch.commit();
    }

    // 3. Save import batch audit log
    try {
      const batchDocRef = doc(db, 'users', userId, 'import_batches', batchId);
      await setDoc(batchDocRef, {
        id: batchId,
        user_id: userId,
        filename: metadata.filename || 'Pasted Transactions',
        source: metadata.source || 'excel',
        bank_name: metadata.bank_name || 'Generic',
        total_detected: metadata.total_detected || approvedTransactions.length,
        imported_count: approvedTransactions.length,
        total_expense: Math.round(totalExpense),
        total_income: Math.round(totalIncome),
        transaction_ids: createdTxIds,
        undone: false,
        created_at: new Date().toISOString()
      });
    } catch (auditErr) {
      console.warn('Could not save import batch audit log:', auditErr);
    }

    // 4. Invalidate affected monthly roll-up caches
    for (const mk of affectedMonths) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'months', mk));
      } catch (e) {}
    }

    // 5. Synchronize newly imported transactions into local storage ledger immediately
    try {
      const currentLocal = api.getLocalTransactions();
      const merged = [...createdTransactions, ...currentLocal];
      const uniqueMap = new Map();
      merged.forEach(t => {
        const idKey = String(t.id);
        if (!uniqueMap.has(idKey)) uniqueMap.set(idKey, t);
      });
      api.saveLocalTransactions(Array.from(uniqueMap.values()));
    } catch (cacheSyncErr) {
      console.warn('Could not sync imported transactions to local storage cache:', cacheSyncErr);
    }
  } else {
    // Local Node/SQLite fallback
    for (const t of approvedTransactions) {
      let amt = parseFloat(t.amount) || 0;
      if (t.is_refund && amt > 0) amt = -amt;
      const res = await api.createTransaction({
        date: t.date,
        description: t.description || 'Imported Expense',
        category: t.category || 'Other',
        payment_mode: t.payment_mode || 'UPI',
        amount: amt,
        is_refund: Boolean(t.is_refund)
      });
      if (res && res.id) createdTxIds.push(res.id);
    }
  }

  const sortedMonths = Array.from(affectedMonths).sort().reverse();

  return {
    success: true,
    batchId,
    importedCount: approvedTransactions.length,
    totalExpense: Math.round(totalExpense),
    totalIncome: Math.round(totalIncome),
    affectedMonths: sortedMonths,
    latestMonth: sortedMonths[0] || new Date().toISOString().slice(0, 7),
    transactionIds: createdTxIds
  };
}

/**
 * Reverts an import batch safely (1-click Undo)
 */
export async function undoImportBatch(userId, batchId) {
  if (!batchId) throw new Error('Missing batch ID to undo.');

  if (isFirebaseConfigured && db && userId) {
    const batchDocRef = doc(db, 'users', userId, 'import_batches', batchId);
    const batchSnap = await getDoc(batchDocRef);

    if (!batchSnap.exists()) {
      throw new Error('Import batch record not found.');
    }

    const batchData = batchSnap.data();
    const txIds = batchData.transaction_ids || [];

    if (txIds.length === 0) {
      throw new Error('No transaction IDs recorded for this batch.');
    }

    const CHUNK_SIZE = 400;
    const txCol = collection(db, 'users', userId, 'transactions');
    const affectedMonths = new Set();

    for (let i = 0; i < txIds.length; i += CHUNK_SIZE) {
      const chunk = txIds.slice(i, i + CHUNK_SIZE);
      const writeB = writeBatch(db);

      for (const id of chunk) {
        const dRef = doc(txCol, String(id));
        writeB.delete(dRef);
      }
      await writeB.commit();
    }

    // Mark batch as undone
    await setDoc(batchDocRef, { ...batchData, undone: true, undone_at: new Date().toISOString() });

    // Invalidate affected monthly caches
    const monthsToInvalidate = batchData.affected_months || [];
    for (const m of monthsToInvalidate) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'months', m));
      } catch (e) {}
    }

    return { success: true, deletedCount: txIds.length };
  } else {
    throw new Error('Undo is supported in cloud mode.');
  }
}

/**
 * Fetches previous import batch logs for Import History view
 */
export async function getImportHistory(userId) {
  if (!isFirebaseConfigured || !db || !userId) return [];

  try {
    const batchCol = collection(db, 'users', userId, 'import_batches');
    const q = query(batchCol, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    const history = [];
    snap.forEach(d => history.push(d.data()));
    return history;
  } catch (err) {
    console.warn('Could not fetch import history:', err);
    return [];
  }
}
