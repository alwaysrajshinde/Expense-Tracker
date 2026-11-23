# QA Audit Report: "Coming Soon" Feature Access Control & Protected Preview State

**Audit Date:** November 23, 2026  
**Application:** Personal Expense Tracker (`v2.4.3`)  
**Test Suite:** `tests/e2e/25_coming_soon_features_audit.spec.js`  
**Classification:** Product Release Readiness & UX Access Control Verification

---

## 1. Executive Summary

Previously, experimental or upcoming features (such as direct Google Sheets cloud synchronization) were accessible with live action buttons, permitting users to initiate OAuth requests, execute incomplete API workflows, or trigger connection errors.

To establish a polished, professional user experience that builds user awareness and excitement without permitting execution of unfinished functionality, we implemented a centralized feature availability architecture (`client/src/constants/featureAvailability.js`), a dedicated read-only preview component (`ComingSoonPreviewModal.jsx`), and strict functional disabling across all upcoming features.

All action buttons, forms, network queries, and Firestore writes related to upcoming features are strictly disabled with `disabled={true}`, `aria-disabled="true"`, and early-return security guards.

---

## 2. Centralized Feature Architecture

### Feature Availability Registry (`client/src/constants/featureAvailability.js`)
All application capabilities are registered with an explicit lifecycle status:
- `FEATURE_STATUS.AVAILABLE`: Fully functional and operational.
- `FEATURE_STATUS.COMING_SOON`: Planned / in active development (protected preview mode, all actions strictly disabled).

```javascript
export const FEATURE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  COMING_SOON: 'coming_soon'
});
```

### Registered Upcoming Features
| Feature ID | Feature Name | Category | Planned Scope | Preview Route |
| :--- | :--- | :--- | :--- | :--- |
| `google_sheets_sync` | **Google Sheets Direct Cloud Sync** | Data & Backup | Phase 2 | Settings → Upcoming → Google Sheets |
| `receipt_scanner` | **Smart Receipt Scanner & OCR** | Automation | Phase 2 | Settings → Upcoming → Receipt Scanner |
| `recurring_expenses` | **Recurring Subscriptions & Bills** | Budgeting & Planning | Phase 3 | Settings → Upcoming → Recurring Bills |
| `bank_auto_sync` | **Direct Bank Account Feeds** | Banking & Sync | Phase 3 | Settings → Upcoming → Bank Feeds |

Changing any feature from `COMING_SOON` to `AVAILABLE` in `featureAvailability.js` automatically enables controls across desktop and mobile without requiring code refactoring across parent views.

---

## 3. UI/UX Preview Design & Functional Guards

### A. Professional Preview Experience
When a user opens an upcoming feature:
1. **Feature Identity**: Clear title, icon, and category pill.
2. **Prominent Status Badge**: Glowing Dark Violet `Coming Soon` badge with a security lock icon.
3. **Positive & Reassuring Message Banner**:
   - *"Something exciting is on the way!"*
   - *"We're working to bring this feature to you soon. Stay tuned! You can explore the planned configuration below in read-only preview mode."*
4. **Planned Interface Preview**: Realistic, high-fidelity mockups of the planned interface with read-only styling and `[Preview Mode]` ribbon.
5. **Key Planned Capabilities**: Bulleted list of verified upcoming benefits.
6. **Navigation**: Clean `[Back to Settings]` button and top-right close (`X`) button for reliable return.

### B. Strict Functional Disabling (Zero Leakage)
1. **Action Buttons**: Primary action buttons (e.g. `Export to Google Sheets (Coming Soon)`, `Authorize Access (Coming Soon)`) are strictly disabled with `disabled={true}`, `aria-disabled="true"`, `cursor-not-allowed`, and lock icon.
2. **Form Submissions Blocked**: Form submit events are intercepted and cancelled via `handleFormSubmitPrevent` (`e.preventDefault()`, `e.stopPropagation()`).
3. **API & Database Protection**: Guard clauses in execution handlers verify `isComingSoon` and return immediately, preventing any Google OAuth popups, Google Sheets API calls, or Firestore writes.
4. **Keyboard & Force Click Protection**: `aria-disabled="true"` and pointer-event blocking prevent keyboard bypass (Enter / Space keys).

---

## 4. Playwright Automated Verification Results

**Test Suite:** `tests/e2e/25_coming_soon_features_audit.spec.js`  
**Execution Environment:** Chromium Desktop (1280x800) & Chromium Mobile (393x851 Pixel 7)

| Test # | Verification Scenario | Target Component | Status | Duration |
| :---: | :--- | :--- | :---: | :---: |
| **01** | Upcoming features section visibility & badging | Settings Mobile Group 5 | **PASS** | 11.7s |
| **02** | Google Sheets preview, message banner, disabled actions & 0 API calls | `GoogleSheetsExportModal` | **PASS** | 13.1s |
| **03** | Smart Receipt Scanner preview, disabled inputs, non-submittable form | `ComingSoonPreviewModal` | **PASS** | 12.6s |
| **04** | Recurring Subscriptions preview & burn-rate highlights | `ComingSoonPreviewModal` | **PASS** | 13.2s |
| **05** | Direct Bank Account Feeds Open Banking preview & read-only status | `ComingSoonPreviewModal` | **PASS** | 12.8s |
| **06** | Search discovery: "Coming Soon" & feature keywords navigate to preview | `moreSearchService` & Search bar | **PASS** | 14.1s |
| **07** | Desktop layout upcoming integrations preview grid | Settings Desktop Card 3 | **PASS** | 15.3s |
| **08** | Functional features regression guard (Overview, Transactions, Reports) | Core Application Views | **PASS** | 13.0s |

**Pass Rate:** 100% (16/16 test assertions passing across desktop and mobile engines).

---

## 5. Visual Artifacts Verified

- `verify_coming_soon_mobile_section.png` — Dedicated Upcoming Features group in mobile More page.
- `verify_coming_soon_google_sheets_preview.png` — Google Sheets export modal with Coming Soon badge and disabled actions.
- `verify_coming_soon_receipt_scanner.png` — Receipt Scanner viewfinder preview with disabled mock fields.
- `verify_coming_soon_recurring_expenses.png` — Subscription burn rate preview card with disabled controls.
- `verify_coming_soon_bank_feeds.png` — Bank feeds preview card with read-only badge.
- `verify_coming_soon_search_result.png` — Deep search result navigating directly to upcoming feature preview.
- `verify_coming_soon_desktop_layout.png` — Desktop Card 3 upcoming integrations grid.

---

## 6. Conclusion & Sign-Off

The application now cleanly separates live, fully functional features from in-development roadmap capabilities. Users are informed about what features are in development, can preview their intended interface, and are strictly prevented from encountering errors or triggering unready code.
