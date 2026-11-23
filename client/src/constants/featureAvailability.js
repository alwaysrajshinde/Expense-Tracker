/**
 * Centralized Feature Availability Registry
 * Single Source of Truth for feature lifecycle states:
 * - 'available': Fully functional and operational
 * - 'coming_soon': Planned / in active development (protected preview mode, all actions disabled)
 */

export const FEATURE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  COMING_SOON: 'coming_soon'
});

export const FEATURES_REGISTRY = Object.freeze({
  // 1. Google Sheets Direct Cloud Sync
  google_sheets_sync: {
    id: 'google_sheets_sync',
    name: 'Google Sheets Direct Cloud Sync',
    shortName: 'Google Sheets',
    status: FEATURE_STATUS.COMING_SOON,
    category: 'Data & Backup',
    iconName: 'FileSpreadsheet',
    badgeText: 'Coming Soon',
    badgeColor: '#6C47FF',
    tagline: 'Something exciting is on the way!',
    description: 'Direct cloud export & real-time sync to your personal Google Drive and Google Sheets workbook.',
    subtext: "This feature is currently in development. We're preparing direct Google Drive integration to deliver a seamless multi-device spreadsheet sync for you.",
    highlights: [
      'One-click automated export to Google Drive without downloading intermediate files',
      'Live spreadsheet sync with zero manual re-entry across desktop and mobile',
      'Custom date range and categorical ledger formatting with pre-calculated subtotals',
      'Multi-sheet history with secure OAuth 2.0 consumer-owned authorization'
    ],
    plannedDate: 'Phase 2 Release'
  },

  // 2. Smart Receipt Scanner & OCR
  receipt_scanner: {
    id: 'receipt_scanner',
    name: 'Smart Receipt Scanner & OCR',
    shortName: 'Receipt Scanner',
    status: FEATURE_STATUS.COMING_SOON,
    category: 'Automation',
    iconName: 'Camera',
    badgeText: 'Coming Soon',
    badgeColor: '#10B981',
    tagline: "We're working on something useful!",
    description: 'Scan paper receipts or bills with your smartphone camera to automatically extract date, vendor, tax, and itemized amounts.',
    subtext: "Smart receipt parsing is in active development. We're training privacy-preserving on-device optical character recognition to instantly log your expenses.",
    highlights: [
      'Snap a photo or upload receipt image directly from your mobile camera or gallery',
      'AI vendor matching and auto-classification into your existing categories',
      'Automatic total, tax, currency, and transaction date extraction with zero typing',
      '100% on-device OCR privacy without sending receipt images to external third parties'
    ],
    plannedDate: 'Phase 2 Release'
  },

  // 3. Recurring Subscriptions & Bills
  recurring_expenses: {
    id: 'recurring_expenses',
    name: 'Recurring Subscriptions & Bills',
    shortName: 'Recurring Bills',
    status: FEATURE_STATUS.COMING_SOON,
    category: 'Budgeting & Planning',
    iconName: 'CalendarClock',
    badgeText: 'Coming Soon',
    badgeColor: '#F59E0B',
    tagline: 'Something exciting is on the way!',
    description: 'Track recurring subscriptions like Netflix, Spotify, gym memberships, and rent with automatic upcoming renewal alerts.',
    subtext: "We're crafting a dedicated subscription manager to give you full visibility into monthly burn rate and eliminate unwanted auto-renewals.",
    highlights: [
      'Automatic detection of monthly and annual recurring patterns in your transaction history',
      'Advance renewal notifications sent before payment due dates to prevent surprise charges',
      'Dedicated subscription burn-rate calculator integrated into your Overview budget',
      '1-tap cancellation links and renewal calendar overview'
    ],
    plannedDate: 'Phase 3 Release'
  },

  // 4. Direct Bank Account Feeds
  bank_auto_sync: {
    id: 'bank_auto_sync',
    name: 'Direct Bank Account Feeds',
    shortName: 'Bank Feeds',
    status: FEATURE_STATUS.COMING_SOON,
    category: 'Banking & Sync',
    iconName: 'Landmark',
    badgeText: 'Coming Soon',
    badgeColor: '#3B82F6',
    tagline: "We're working on something useful!",
    description: 'Secure, read-only Open Banking and Account Aggregator integration for automated daily transaction synchronization.',
    subtext: "Bank-grade read-only feeds are in development with RBI-compliant Account Aggregator frameworks to safely eliminate manual statement uploads.",
    highlights: [
      'Read-only 256-bit encrypted bank connection with zero credential storage',
      'Daily automated ledger updates with intelligent duplicate transaction detection',
      'Supports all major Indian and international banking portals and UPI handles',
      'Granular account-level spending limits and instant cashflow summaries'
    ],
    plannedDate: 'Phase 3 Release'
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
