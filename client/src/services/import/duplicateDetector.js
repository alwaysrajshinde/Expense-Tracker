/**
 * Intelligent Duplicate Detection Engine
 */

/**
 * Evaluates candidate transactions against existing ledger transactions
 */
export function detectDuplicates(candidates = [], existingTransactions = []) {
  if (!candidates || candidates.length === 0) return [];
  if (!existingTransactions || existingTransactions.length === 0) {
    return candidates.map(c => ({
      ...c,
      duplicateStatus: 'unique',
      duplicateReason: '',
      duplicateExistingTx: null,
      selected: true
    }));
  }

  // Pre-index existing transactions for high performance
  const refMap = new Map();
  const dateAmountMap = new Map();

  existingTransactions.forEach(tx => {
    // 1. Index by reference ID if present
    if (tx.reference_id && String(tx.reference_id).trim()) {
      const cleanRef = String(tx.reference_id).trim().toLowerCase();
      refMap.set(cleanRef, tx);
    }

    // 2. Index by date + amount
    const amt = Math.abs(parseFloat(tx.amount) || 0).toFixed(2);
    const date = tx.date || '';
    if (date && amt) {
      const key = `${date}_${amt}`;
      if (!dateAmountMap.has(key)) {
        dateAmountMap.set(key, []);
      }
      dateAmountMap.get(key).push(tx);
    }
  });

  return candidates.map(candidate => {
    const candidateAmt = Math.abs(parseFloat(candidate.amount) || 0).toFixed(2);
    const candidateDate = candidate.date || '';
    const candidateRef = candidate.reference_id ? String(candidate.reference_id).trim().toLowerCase() : '';

    // Check 1: Confirmed Duplicate by Reference / UTR ID
    if (candidateRef && refMap.has(candidateRef)) {
      const match = refMap.get(candidateRef);
      return {
        ...candidate,
        duplicateStatus: 'confirmed_duplicate',
        duplicateReason: `Exact match with Reference/UTR ID (${candidate.reference_id})`,
        duplicateExistingTx: match,
        selected: false // Deselected by default to prevent duplicate writes
      };
    }

    // Check 2: Same Date + Same Amount
    const exactKey = `${candidateDate}_${candidateAmt}`;
    if (dateAmountMap.has(exactKey)) {
      const matches = dateAmountMap.get(exactKey);
      const match = matches[0];
      return {
        ...candidate,
        duplicateStatus: 'possible_duplicate',
        duplicateReason: `Existing transaction with identical amount (${candidateAmt}) on ${candidateDate}`,
        duplicateExistingTx: match,
        selected: false
      };
    }

    // Check 3: Fuzzy Date (±1 Day) + Same Amount + Similar description
    const adjacentDates = getAdjacentDates(candidateDate);
    for (const adjDate of adjacentDates) {
      const adjKey = `${adjDate}_${candidateAmt}`;
      if (dateAmountMap.has(adjKey)) {
        const matches = dateAmountMap.get(adjKey);
        const similarMatch = matches.find(m => isDescriptionSimilar(m.description, candidate.description));
        if (similarMatch) {
          return {
            ...candidate,
            duplicateStatus: 'possible_duplicate',
            duplicateReason: `Similar transaction within 24 hours on ${adjDate}`,
            duplicateExistingTx: similarMatch,
            selected: false
          };
        }
      }
    }

    // Unique record
    return {
      ...candidate,
      duplicateStatus: 'unique',
      duplicateReason: '',
      duplicateExistingTx: null,
      selected: true
    };
  });
}

/**
 * Returns previous day and next day in YYYY-MM-DD
 */
function getAdjacentDates(dateStr) {
  if (!dateStr || !dateStr.includes('-')) return [];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return [];
    
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    return [
      prev.toISOString().slice(0, 10),
      next.toISOString().slice(0, 10)
    ];
  } catch (e) {
    return [];
  }
}

/**
 * Checks similarity between two strings
 */
function isDescriptionSimilar(desc1 = '', desc2 = '') {
  if (!desc1 || !desc2) return false;
  const s1 = desc1.toLowerCase().trim();
  const s2 = desc2.toLowerCase().trim();
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;
  return false;
}
