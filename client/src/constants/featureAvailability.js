/**
 * Centralized Feature Availability Registry
 * Single Source of Truth for feature lifecycle states:
 * - 'available': Fully functional, live operational (₹0 budget compliant)
 * - 'coming_soon': Planned / in active development (protected preview mode, all actions disabled)
 *
 * Audit Outcomes (Zero-Cost Architectural Audit):
 * 1. Google Sheets Direct Cloud Sync -> SIMPLIFY (Available via direct 1-click client-side export & sheet sync)
 * 2. Smart Receipt Scanner & OCR -> KEEP (Available via 100% on-device canvas & heuristic extraction)
 * 3. Recurring Subscriptions & Bills -> KEEP (Available via client-side foreground reconciliation & burn-rate engine)
 * 4. Direct Bank Account Feeds -> REMOVE (Replaced with 100% free Smart Bank Statement Import)
 */

export const FEATURE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  COMING_SOON: 'coming_soon'
});

export const FEATURES_REGISTRY = Object.freeze({
  // 1. Google Sheets Cloud Export & Sync (Decision: SIMPLIFY -> AVAILABLE)
  google_sheets_sync: {
    id: 'google_sheets_sync',
    name: 'Google Sheets Cloud Export & Sync',
    shortName: 'Google Sheets',
    status: FEATURE_STATUS.AVAILABLE,
    category: 'Data & Backup',
    iconName: 'FileSpreadsheet',
    badgeText: 'Active',
    badgeColor: '#10B981',
    description: 'Direct cloud export & spreadsheet creation in your personal Google Drive with zero server costs.',
    subtext: 'Client-side Google Drive & Sheets API integration operating within Google free quotas (300 req/min).',
    highlights: [
      '1-Click direct export to Google Drive without downloading intermediate files',
      'Custom date range and categorical ledger formatting with pre-calculated subtotals',
      'Client-side OAuth 2.0 with restricted Google Sheets permissions',
      'Zero monthly server or webhook costs (100% ₹0 budget compliant)'
    ],
    plannedDate: 'Active'
  },

  // 2. Smart Receipt Scanner & OCR (Decision: KEEP -> AVAILABLE)
  receipt_scanner: {
    id: 'receipt_scanner',
    name: 'Smart Receipt Scanner & OCR',
    shortName: 'Receipt Scanner',
    status: FEATURE_STATUS.AVAILABLE,
    category: 'Automation',
    iconName: 'Camera',
    badgeText: 'Active',
    badgeColor: '#10B981',
    description: 'Scan paper receipts or bills with your camera or file upload to automatically extract vendor, date, and amount with zero cloud fees.',
    subtext: 'Local canvas contrast filtering and heuristic extraction running entirely in your browser.',
    highlights: [
      'Snap a photo or upload receipt image directly from mobile camera or desktop file picker',
      'Client-side canvas preprocessing and high-contrast binarization',
      'Instant extraction for Total Amount (₹), Date, and Vendor name',
      '100% privacy: zero images or financial figures transmitted to third-party APIs'
    ],
    plannedDate: 'Active'
  },

  // 3. Recurring Subscriptions & Bills (Decision: KEEP -> AVAILABLE)
  recurring_expenses: {
    id: 'recurring_expenses',
    name: 'Recurring Subscriptions & Bills',
    shortName: 'Recurring Bills',
    status: FEATURE_STATUS.AVAILABLE,
    category: 'Budgeting & Planning',
    iconName: 'CalendarClock',
    badgeText: 'Active',
    badgeColor: '#6C47FF',
    description: 'Track recurring subscriptions, calculate monthly burn rate, and get automatic upcoming renewal alerts with zero server cron cost.',
    subtext: 'Client-side foreground reconciliation engine calculating next billing cycles and advance renewal warnings.',
    highlights: [
      'Client-side Launch & Foreground reconciliation engine (zero paid cloud crons)',
      'Advance renewal notifications for bills due within 7 days to eliminate surprise charges',
      'Dedicated monthly subscription burn-rate calculation integrated into your budget',
      '1-Click logging to instantly record recurring bills into your transaction ledger'
    ],
    plannedDate: 'Active'
  },

  // 4. Smart Bank Statement Import (Decision: REMOVE Bank Feeds -> Replaced with Statement Import -> AVAILABLE)
  bank_statement_import: {
    id: 'bank_statement_import',
    name: 'Smart Bank Statement Import',
    shortName: 'Statement Import',
    status: FEATURE_STATUS.AVAILABLE,
    category: 'Banking & Import',
    iconName: 'Landmark',
    badgeText: 'Active',
    badgeColor: '#3B82F6',
    description: 'Import bank statements securely via PDF, Excel, and CSV with zero API fees, 100% privacy, and instant auto-categorization.',
    subtext: 'Replaces expensive Account Aggregator monthly subscriptions with client-side statement parsing for HDFC, SBI, ICICI, and more.',
    highlights: [
      'Zero bank API costs: eliminates ₹25,000+ monthly Account Aggregator platform fees',
      '100% Client-side PDF, CSV, and XLSX parsing with duplicate detection',
      'Zero credential sharing: bank login credentials never leave your custody',
      'Compliant with RBI digital lending and personal privacy norms'
    ],
    plannedDate: 'Active'
  },

  // Backward compatibility alias for any references to bank_auto_sync
  bank_auto_sync: {
    id: 'bank_auto_sync',
    name: 'Direct Bank Account Feeds (Replaced)',
    shortName: 'Bank Import',
    status: FEATURE_STATUS.AVAILABLE,
    category: 'Banking & Import',
    iconName: 'Landmark',
    badgeText: 'Replaced',
    badgeColor: '#3B82F6',
    description: 'Direct feeds removed due to RBI Account Aggregator platform fees (₹25k+/mo). Replaced with free Smart Bank Statement Import.',
    highlights: [
      'Free bank statement parsing via PDF, Excel, and CSV',
      'Zero API charges or recurring fees'
    ],
    plannedDate: 'Active'
  }
});

/**
 * Checks whether a feature is available for live execution
 * @param {string} featureId
 * @returns {boolean}
 */
export function isFeatureAvailable(featureId) {
  const feat = FEATURES_REGISTRY[featureId];
  return feat ? feat.status === FEATURE_STATUS.AVAILABLE : true;
}

/**
 * Checks whether a feature is currently designated as Coming Soon
 * @param {string} featureId
 * @returns {boolean}
 */
export function isFeatureComingSoon(featureId) {
  const feat = FEATURES_REGISTRY[featureId];
  return feat ? feat.status === FEATURE_STATUS.COMING_SOON : false;
}

/**
 * Retrieves the full configuration for a given feature ID
 * @param {string} featureId
 * @returns {object|null}
 */
export function getFeatureConfig(featureId) {
  return FEATURES_REGISTRY[featureId] || null;
}

/**
 * Retrieves all registered features marked as Coming Soon
 * @returns {Array<object>}
 */
export function getComingSoonFeatures() {
  return Object.values(FEATURES_REGISTRY).filter(
    f => f.status === FEATURE_STATUS.COMING_SOON
  );
}

/**
 * Retrieves all registered features as an array
 * @returns {Array<object>}
 */
export function getAllFeatures() {
  return Object.values(FEATURES_REGISTRY);
}
