/**
 * Intelligent Bank Narration & Merchant Classification Engine
 */

// Category dictionary for automated classification
const CATEGORY_RULES = [
  {
    category: 'Salary',
    keywords: ['salary', 'sal/', 'payroll', 'stipend', 'wages', 'compensation']
  },
  {
    category: 'Investment',
    keywords: ['dividend', 'interest', 'int.pd', 'mutual fund', 'zerodha', 'groww', 'kuvera', 'angel one', 'upstox']
  },
  {
    category: 'Food & Dining',
    keywords: ['swiggy', 'zomato', 'mcdonald', 'starbucks', 'dominos', 'pizza', 'burger', 'kfc', 'subway', 'restaurant', 'cafe', 'dining', 'bakery', 'eats', 'chai', 'tea', 'coffee', 'haldiram', 'barbeque']
  },
  {
    category: 'Groceries',
    keywords: ['blinkit', 'zepto', 'bigbasket', 'instamart', 'dmart', 'reliance fresh', 'reliance smart', 'supermarket', 'grocer', 'kirana', 'nature basket', 'spencer', 'provisions', 'vegetable', 'fruit', 'dairy', 'milk']
  },
  {
    category: 'Transportation',
    keywords: ['uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'hpcl', 'bpcl', 'iocl', 'indian oil', 'fastag', 'toll', 'parking', 'auto', 'cab']
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'zara', 'h&m', 'croma', 'vijay sales', 'reliance digital', 'apple', 'clothing', 'apparel', 'retail', 'fashion', 'mall']
  },
  {
    category: 'Bills & Utilities',
    keywords: ['electricity', 'bescom', 'tata power', 'adani power', 'water bill', 'gas bill', 'igl', 'mgl', 'airtel', 'jio', 'vi ', 'vodafone', 'broadband', 'act fibernet', 'recharge', 'dth', 'tata sky']
  },
  {
    category: 'Rent & Housing',
    keywords: ['rent', 'landlord', 'society maintenance', 'maintenance charges', 'apartment', 'housing society', 'flat maintenance']
  },
  {
    category: 'Health',
    keywords: ['apollo', 'pharmacy', 'medplus', 'netmeds', '1mg', 'pharmeasy', 'hospital', 'clinic', 'diagnostic', 'pathology', 'dental', 'doctor', 'healthcare', 'medical', 'chemist']
  },
  {
    category: 'Entertainment',
    keywords: ['netflix', 'spotify', 'bookmyshow', 'pvr', 'inox', 'cinepolis', 'prime video', 'disney', 'hotstar', 'cinema', 'theatre', 'gaming', 'steam', 'playstation', 'youtube premium']
  },
  {
    category: 'Education',
    keywords: ['school', 'college', 'university', 'tuition', 'coaching', 'coursera', 'udemy', 'edx', 'books', 'stationery', 'exam fee', 'course']
  },
  {
    category: 'Travel',
    keywords: ['makemytrip', 'goibibo', 'cleartrip', 'yatra', 'irctc', 'railway', 'indigo', 'air india', 'vistara', 'spicejet', 'hotel', 'resort', 'airbnb', 'flight', 'stay']
  },
  {
    category: 'Personal Care',
    keywords: ['salon', 'spa', 'barber', 'parlour', 'gym', 'fitness', 'cult.fit', 'cult fit', 'cosmetics', 'beauty']
  },
  {
    category: 'EMI & Loans',
    keywords: ['emi', 'loan', 'bajaj finance', 'home loan', 'car loan', 'personal loan', 'credit card payment', 'cc payment', 'ach/', 'nach/']
  }
];

/**
 * Masks 10 to 16 digit account numbers or card numbers inside text to last 4 digits
 */
export function maskSensitiveAccountNumbers(text = '') {
  if (!text) return '';
  // Mask 12-16 digit numbers (card / bank account)
  return text.replace(/\b\d{8,12}(\d{4})\b/g, 'XXXXXXXX$1');
}

/**
 * Extracts a clean merchant name from messy UPI, POS, or NEFT strings
 */
export function extractCleanMerchant(narration = '') {
  if (!narration) return 'Imported Transaction';

  const clean = narration.trim();

  // Pattern: UPI/432109876543/SWIGGY/swiggy@icici/...
  // Pattern: UPI/P2A/1234567890/SWIGGY/...
  if (/^UPI[\/:]/i.test(clean)) {
    const parts = clean.split(/[\/:]/);
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i].trim();
      if (!p) continue;
      if (/^(?:P2A|P2P|CR|DR|REV|[0-9]+)$/i.test(p)) continue;
      // If this part is a VPA like name@okhdfc, strip the @domain or check if previous/next was merchant
      if (p.includes('@')) {
        const vpaName = p.split('@')[0];
        if (vpaName && !/^[0-9]+$/.test(vpaName)) {
          return cleanMerchantString(vpaName);
        }
        continue;
      }
      return cleanMerchantString(p);
    }
  }

  // Pattern: POS 402213XXXXXX1234 RELIANCE SMART / POS/MERCHANT
  const posMatch = clean.match(/POS\s*(?:\/|\s+)(?:[0-9X*]+\s+)?([^/]+)/i);
  if (posMatch && posMatch[1]) {
    return cleanMerchantString(posMatch[1]);
  }

  // Pattern: NEFT/RTGS/IMPS - RECIPIENT
  const neftMatch = clean.match(/(?:NEFT|IMPS|RTGS)[^/]*\/(?:[^/]+\/)?([^/]+)/i);
  if (neftMatch && neftMatch[1]) {
    return cleanMerchantString(neftMatch[1]);
  }

  // Pattern: ACH/NACH EMI
  if (/ACH|NACH/i.test(clean)) {
    return cleanMerchantString(clean.replace(/ACH|NACH|\/|DR/gi, ' '));
  }

  // Fallback: remove leading technical alphanumeric codes
  let simplified = clean
    .replace(/^(?:UPI|POS|NEFT|IMPS|RTGS|ACH|NACH|ATM|WDL|INB|MB)[-_/\s]*/i, '')
    .replace(/[0-9]{8,}/g, '') // remove large numbers
    .replace(/[-_/]{2,}/g, ' ')
    .trim();

  return cleanMerchantString(simplified || clean);
}

function cleanMerchantString(str) {
  let s = str
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove common banking noise words
  s = s.replace(/\b(P2A|P2P|BIL|PAYMENT|MUMBAI|PUNE|DELHI|BLR|BANGALORE|IND|IN)\b/gi, '').trim();

  if (s.length === 0) return 'Transaction';

  // Capitalize title case
  return s
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Classifies an imported transaction:
 * Suggests merchant name, category, payment mode, and financial transaction type
 */
export function classifyNarration(rawNarration = '', rawAmount = 0, isCredit = false) {
  const narrationLower = (rawNarration || '').toLowerCase();
  const maskedNarration = maskSensitiveAccountNumbers(rawNarration);
  const cleanMerchant = extractCleanMerchant(rawNarration);

  // 1. Detect Transaction Type
  let type = 'expense';
  let isRefund = false;
  let isTransfer = false;

  if (/(refund|reversal|rev\/|cashback)/i.test(narrationLower)) {
    type = 'refund';
    isRefund = true;
  } else if (/(tfr to|tfr from|transfer to self|self tfr|own a\/c|sweep)/i.test(narrationLower)) {
    type = 'transfer';
    isTransfer = true;
  } else if (isCredit || /(salary|int\.pd|interest|dividend|credit interest)/i.test(narrationLower)) {
    type = 'income';
  }

  // 2. Detect Payment Mode
  let paymentMode = 'UPI';
  if (/upi/i.test(narrationLower)) {
    paymentMode = 'UPI';
  } else if (/pos|card|visa|mastercard|rupay/i.test(narrationLower)) {
    paymentMode = 'Debit Card';
  } else if (/atm|wdl|cash/i.test(narrationLower)) {
    paymentMode = 'Cash';
  } else if (/neft|rtgs|imps|netbanking|inb/i.test(narrationLower)) {
    paymentMode = 'Net Banking';
  } else if (/emi|ach|nach/i.test(narrationLower)) {
    paymentMode = 'EMI';
  }

  // 3. Detect Category
  let category = 'Other';
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => narrationLower.includes(kw))) {
      category = rule.category;
      break;
    }
  }

  return {
    cleanDescription: cleanMerchant,
    rawNarration: maskedNarration,
    category,
    paymentMode,
    type,
    isRefund,
    isTransfer
  };
}
