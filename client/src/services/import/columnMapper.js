/**
 * Intelligent Column Detection & Mapping Engine
 */

const STORAGE_SAVED_MAPPINGS = 'et_saved_import_mappings';

// Header fuzzy pattern library
const FIELD_PATTERNS = {
  date: [
    /^date$/i,
    /txn.*date/i,
    /transaction.*date/i,
    /value.*date/i,
    /posting.*date/i,
    /booking.*date/i,
    /expense.*date/i,
    /^dt$/i,
    /tran.*date/i
  ],
  description: [
    /narration/i,
    /particulars/i,
    /description/i,
    /remarks/i,
    /details/i,
    /transaction.*remarks/i,
    /transaction.*details/i,
    /payee/i,
    /merchant/i,
    /note/i
  ],
  amount: [
    /^amount$/i,
    /^net.*amount$/i,
    /^transaction.*amount$/i,
    /^txn.*amount$/i,
    /^expense$/i,
    /^value$/i,
    /^total$/i,
    /^amt$/i
  ],
  debit: [
    /^debit/i,
    /withdrawal/i,
    /^dr/i,
    /\(dr\)/i,
    /dr.*amount/i,
    /withdrawal.*amt/i,
    /withdrawal.*amount/i,
    /debit.*amount/i,
    /^spent$/i,
    /^paid.*out$/i
  ],
  credit: [
    /^credit/i,
    /deposit/i,
    /^cr/i,
    /\(cr\)/i,
    /cr.*amount/i,
    /deposit.*amt/i,
    /deposit.*amount/i,
    /credit.*amount/i,
    /^received$/i,
    /^paid.*in$/i
  ],
  category: [
    /^category$/i,
    /^expense.*category$/i,
    /^expense.*type$/i,
    /^head$/i,
    /^tag$/i
  ],
  payment_mode: [
    /^payment.*mode$/i,
    /^payment.*method$/i,
    /^mode$/i,
    /^method$/i,
    /^channel$/i,
    /^instrument$/i,
    /^paid.*through$/i,
    /^type$/i
  ],
  reference_id: [
    /^ref.*no/i,
    /^reference/i,
    /^reference.*id/i,
    /^utr/i,
    /^utr.*number/i,
    /^chq.*no/i,
    /^cheque.*no/i,
    /^cheque.*number/i,
    /^txn.*id/i,
    /^transaction.*id/i
  ],
  balance: [
    /^balance$/i,
    /^closing.*balance$/i,
    /^running.*balance$/i,
    /^available.*balance$/i,
    /^account.*balance$/i,
    /^bal$/i
  ]
};

/**
 * Automatically inspects headers and matches them to application fields
 */
export function autoDetectColumnMapping(headers = []) {
  const mapping = {
    date: '',
    description: '',
    amount: '',
    debit: '',
    credit: '',
    category: '',
    payment_mode: '',
    reference_id: '',
    balance: ''
  };

  const confidence = {};
  const usedIndices = new Set();

  Object.keys(FIELD_PATTERNS).forEach(field => {
    const patterns = FIELD_PATTERNS[field];

    for (let i = 0; i < headers.length; i++) {
      if (usedIndices.has(i)) continue;
      const header = headers[i].trim();

      // Check regex matches
      const isMatch = patterns.some(pattern => pattern.test(header));
      if (isMatch) {
        mapping[field] = header;
        confidence[field] = 'high';
        usedIndices.add(i);
        break;
      }
    }
  });

  // Decide mode: Two-column (debit/credit) or Single-column (amount)
  const isTwoColumn = Boolean(mapping.debit && mapping.credit);
  const amountMode = isTwoColumn ? 'debit_credit' : 'single_amount';

  // If single amount mode and no direct amount match, try to find numeric candidate from sample
  return {
    mapping,
    amountMode,
    confidence,
    isComplete: Boolean(mapping.date && (mapping.amount || (mapping.debit && mapping.credit)))
  };
}

/**
 * Saves an approved mapping template to localStorage for future imports
 */
export function saveMappingTemplate(key, mapping) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_SAVED_MAPPINGS) || '{}');
    saved[key.toLowerCase()] = mapping;
    localStorage.setItem(STORAGE_SAVED_MAPPINGS, JSON.stringify(saved));
  } catch (e) {
    console.warn('Could not save mapping template:', e);
  }
}

/**
 * Retrieves a saved mapping template for a known bank or file signature
 */
export function getSavedMappingTemplate(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_SAVED_MAPPINGS) || '{}');
    return saved[key.toLowerCase()] || null;
  } catch (e) {
    return null;
  }
}
