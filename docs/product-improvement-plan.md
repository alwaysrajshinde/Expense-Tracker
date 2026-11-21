# Expense Tracker – Product Improvement & Technical Architecture Plan

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Audience:** Senior Product Manager, UI/UX Designer, Senior Full-Stack Developer, QA Engineer  

---

## Executive Summary

This document provides the root-cause analysis, system architecture, component breakdown, priority ranking, and test criteria for the 18 product improvements identified during comprehensive user testing of the **Personal Expense Tracker** (`https://alwaysrajshinde.github.io/Expense-Tracker/`).

### Critical Guarantees & Constraints
1. **Zero Data Loss / Zero Corruption:** 100% preservation of Raj Shinde's 1,216 historical transactions and 73 custom categories.
2. **Security Integrity:** Strict least-privilege Firestore rules (`request.auth.uid == userId`) maintained with zero security regressions.
3. **Dual Execution Environment:** Full offline/GitHub Pages client capability paired with real-time Firebase backend.

---

## Matrix of Improvements & Priority Classification

| ID | Module / Feature | Priority | Complexity | Affected Files | Status |
|---|---|---|---|---|---|
| **IMP-12** | **Transaction Deletion & Financial Integrity** | **P0** | High | `firestoreService.js`, `api.js`, `App.jsx`, `Transactions.jsx` | Ready |
| **IMP-01** | **Categories Management & Multi-Tenant Clean State** | **P1** | Medium | `firestoreService.js`, `Settings.jsx`, `AddExpenseModal.jsx` | Ready |
| **IMP-02** | **Mobile Quick Expense Entry (Sticky FAB)** | **P1** | Low | `Navbar.jsx`, `AndroidHome.jsx`, `App.jsx` | Ready |
| **IMP-03** | **First-Time Budget Setup & Guided Onboarding** | **P1** | Medium | `OnboardingTourModal.jsx`, `Settings.jsx`, `firestoreService.js` | Ready |
| **IMP-08** | **Native Mobile App Experience (PWA & Safe Areas)** | **P1** | Medium | `index.html`, `manifest.json`, `index.css`, `App.jsx` | Ready |
| **IMP-10** | **Reports Page Calculations & Refund Handling** | **P1** | Medium | `sheetsBackend.js`, `Reports.jsx`, `WindowsReportsPanel.jsx` | Ready |
| **IMP-11** | **Gmail Registration & Verification Status Flow** | **P1** | Medium | `AuthContext.jsx`, `Header.jsx`, `AuthGate.jsx` | Ready |
| **IMP-14** | **Password Reset Experience & Feedback Modal** | **P1** | Low | `AuthGate.jsx`, `AuthContext.jsx` | Ready |
| **IMP-15** | **Google OAuth Production Scopes & Verification Clearance** | **P1** | Low | Google Cloud Console Config | Verified |
| **IMP-16** | **Simplify Universal Login / Registration Flow** | **P1** | Low | `AuthGate.jsx` | Ready |
| **IMP-17** | **Application Back Navigation (Hardware / Browser Popstate)** | **P1** | Medium | `App.jsx`, `AddExpenseModal.jsx`, `NotificationsModal.jsx` | Ready |
| **IMP-04** | **Improve the More / Settings Tab Architecture** | **P2** | Medium | `Settings.jsx` | Ready |
| **IMP-05** | **Month Navigation Context-Aware Rendering** | **P2** | Low | `Header.jsx`, `WindowsHeader.jsx`, `App.jsx` | Ready |
| **IMP-06** | **Actionable Notifications & Threshold Alerts** | **P2** | Medium | `NotificationsModal.jsx`, `App.jsx` | Ready |
| **IMP-07** | **Distinctive Application Toolbar & Brand Identity** | **P2** | Low | `Header.jsx`, `WindowsHeader.jsx` | Ready |
| **IMP-09** | **Multi-Theme Engine (4 Curated Colorways)** | **P2** | Medium | `ThemeContext.jsx`, `index.css`, `Settings.jsx` | Ready |
| **IMP-13** | **Branded Transaction & Auth Email Templates** | **P2** | Low | Firebase Console Configuration & Docs | Ready |
| **IMP-18** | **Release Notes & Version Info Modal** | **P3** | Low | `ReleaseNotesModal.jsx`, `Settings.jsx`, `Navbar.jsx` | Ready |

---

## Detailed Specifications (IMP-01 through IMP-18)

### IMP-12: Transaction Deletion and Financial Calculations (Priority: P0)
- **Current Issue:** Deleting an expense removes the document from Firestore, but the roll-up monthly cache (`users/{userId}/months/{monthKey}`) remains cached with stale totals. Dashboard totals, category breakdowns, and reports show outdated amounts until months are re-queried or wiped. Deletion was also enqueued redundantly in both `App.jsx` and `api.js`.
- **Root Cause:** `firestoreService.deleteTransaction` and `updateTransaction` failed to invalidate `doc(db, 'users', userId, 'months', monthKey)`.
- **Solution:**
  1. In `firestoreService.deleteTransaction`, fetch the transaction snapshot before deletion to extract its `month_key`.
  2. Concurrently delete the transaction document and delete `doc(db, 'users', userId, 'months', monthKey)`.
  3. In `updateTransaction`, invalidate both old and new month keys if date changed.
  4. Ensure `handleDeleteTransaction` in `App.jsx` calls `api.deleteTransaction` once, updates local optimistic state immediately, and calls `handleRefreshAll()`.
- **Testing Requirements:** Create transaction -> verify dashboard total increases -> delete transaction -> verify dashboard total immediately drops by exact amount; verify refunds (`is_refund: true`) correctly restore balance.

---

### IMP-01: Categories Management (Priority: P1)
- **Current Issue:** Personal categories (e.g. Biryani, Chicken, Office Lunch) were seeded or visible in generic views, causing clutter for new users.
- **Root Cause:** Legacy seed logic previously pushed personal category names into general category arrays.
- **Solution:**
  1. Default categories for new users strictly limited to 8 core essentials: Food & Dining, Groceries, Transportation, Shopping, Bills & Utilities, Entertainment, Health, and Other.
  2. Raj Shinde's account (`raaajshinde@gmail.com`) retains his full 73 categories and 1,216 historical records without touching his subcollection.
  3. Users can create, customize, and delete personal categories via Settings or Add Expense modal.
- **Testing Requirements:** Register new user -> verify only 8 clean categories exist; log in as Raj -> verify all 73 categories and 1,216 transactions remain intact.

---

### IMP-02: Mobile Quick Expense Entry (Priority: P1)
- **Current Issue:** On mobile viewport, users have to scroll down to find quick-entry fields or tap into nested menus.
- **Root Cause:** Quick-entry form was placed below summary cards in mobile view.
- **Solution:**
  1. Add a prominent, elevated Floating Action Button (FAB) `+` centered on the mobile bottom navigation bar (`Navbar.jsx`).
  2. Tap immediately opens `<AddExpenseModal>` with auto-focused amount input and instant numeric keypad on mobile.
- **Testing Requirements:** Mobile viewport (390x844) -> FAB visible above fold on every screen -> 1 tap opens modal with autofocus.

---

### IMP-03: First-Time Budget Setup (Priority: P1)
- **Current Issue:** First-time users are dropped on the dashboard with ₹0 budget without a clear opportunity to establish a monthly limit.
- **Root Cause:** Onboarding tour was purely informational without interactive input.
- **Solution:**
  1. Add an interactive monthly budget step to `<OnboardingTourModal>`: "Set your monthly spending target (e.g. ₹15,000)".
  2. Provide "Save & Continue" and "Skip for now (Defaults to ₹0)" buttons.
  3. Explain that budget enables real-time remaining balance calculations.
- **Testing Requirements:** New user onboarding -> input ₹20,000 -> save -> dashboard shows ₹20,000 budget and remaining balance.

---

### IMP-04: Improve the More / Settings Tab (Priority: P2)
- **Current Issue:** Redundant options, cluttered settings list with duplicate actions.
- **Root Cause:** Features grew organically into an unstructured list.
- **Solution:**
  1. Reorganize Settings into 6 clear sections:
     - **Profile & Account:** User email, provider badge, verification status, logout.
     - **Financial Targets:** Monthly budget input, currency selector.
     - **Categories:** Manage custom categories, quick toggles.
     - **Themes & Appearance:** Theme selector (4 colorways).
     - **Data & Synchronization:** Google Drive sync, CSV export, backup.
     - **About & Legal:** Release notes (v1.1.0), privacy policy, terms of service.
- **Testing Requirements:** Verify all 6 sections render cleanly; no duplicate buttons exist.

---

### IMP-05: Month Navigation Context-Aware Rendering (Priority: P2)
- **Current Issue:** Month selector dropdown renders on every screen (even Settings and Profile) via `Header.jsx`.
- **Root Cause:** Global header rendered month selector unconditionally.
- **Solution:**
  1. Conditionally render month selector in `Header.jsx` and `WindowsHeader.jsx` only when `activeTab === 'home' || activeTab === 'transactions' || activeTab === 'reports'`.
  2. Hide month selector on `settings`.
- **Testing Requirements:** Navigate to Settings -> verify month selector pill is hidden; navigate to Dashboard -> verify month selector pill is visible and interactive.

---

### IMP-06: Notifications Experience (Priority: P2)
- **Current Issue:** Static dummy alerts without functional value.
- **Root Cause:** Hardcoded notification list in `NotificationsModal.jsx`.
- **Solution:**
  1. Generate dynamic, actionable notifications based on actual financial data:
     - Budget Alert: 80% threshold reached.
     - Budget Warning: 100% budget exceeded.
     - Monthly Rollover: Summary of current month savings.
  2. Provide clear toggle in Settings to mute/enable notifications.
- **Testing Requirements:** Set budget to ₹1,000, add ₹850 expense -> verify notification bell lights up with 85% budget alert.

---

### IMP-07: Application Toolbar & Brand Identity (Priority: P2)
- **Current Issue:** Generic toolbar with hardcoded "Authorized Google Account" badge shown even to email/password users.
- **Root Cause:** Static badge markup in `Header.jsx`.
- **Solution:**
  1. Distinctive header with gradient avatar, dynamic greeting based on local time ("Good morning / afternoon / evening").
  2. Context-aware auth badge:
     - Google OAuth: "Google Verified" (Emerald badge).
     - Verified Email: "Email Verified" (Blue badge).
     - Unverified Email: "Pending Verification" (Amber badge with resend action).
- **Testing Requirements:** Check header with Google user, verified email user, and unverified user.

---

### IMP-08: Native Mobile Application Experience (PWA) (Priority: P1)
- **Current Issue:** Installed PWA feels like a standard web page; lacks safe area support and back button handling.
- **Root Cause:** Missing viewport meta `viewport-fit=cover`, missing popstate history handlers.
- **Solution:**
  1. Update `index.html` viewport meta to include `viewport-fit=cover`.
  2. Configure `theme-color` meta dynamically based on theme.
  3. Support iOS and Android safe-area-insets (`env(safe-area-inset-bottom)`).
  4. Ensure standalone display in `manifest.json`.
- **Testing Requirements:** Installed PWA displays edge-to-edge without browser chrome or unwanted scrolling.

---

### IMP-09: Multiple Themes (Priority: P2)
- **Current Issue:** Only binary light and dark modes supported.
- **Root Cause:** Boolean `isDark` toggle in `ThemeContext.jsx`.
- **Solution:**
  1. Expand `ThemeContext.jsx` to support 4 themes:
     - `light` (Clean Slate / Violet accent)
     - `dark` (Dark Slate / Deep purple)
     - `midnight` (Midnight Velvet / OLED pure dark)
     - `emerald` (Emerald Fintech / Mint & charcoal)
  2. Persist theme choice in `localStorage`.
  3. Update CSS custom properties in `index.css`.
- **Testing Requirements:** Switch between all 4 themes; verify contrast, icons, tables, and persist on page reload.

---

### IMP-10: Reports Page Calculations (Priority: P1)
- **Current Issue:** Discrepancies in category and payment mode totals; incorrect handling of refunds in percentages.
- **Root Cause:** Net refund sums were not handled consistently when total spent <= 0.
- **Solution:**
  1. In `sheetsBackend.js`, ensure refunds reduce total spent and category totals properly.
  2. Guard against division by zero in percentages.
  3. Add meaningful empty state when no transactions exist for the selected month.
- **Testing Requirements:** Test Reports with 0 transactions, with 10 transactions, and with refunds; verify math matches Dashboard.

---

### IMP-11: Gmail Registration and Verification Flow (Priority: P1)
- **Current Issue:** Email/password registrants and Google users see ambiguous verification messages.
- **Root Cause:** Lack of `emailVerified` tracking in session state and UI.
- **Solution:**
  1. Store `emailVerified` in user session.
  2. For Google OAuth users: automatically mark as verified (Google pre-verifies Gmail accounts).
  3. For Email/Password registrants: if unverified, show a subtle banner on dashboard: "Please verify your email address to secure your account. [Resend Link]".
  4. Once verified (checked on session refresh), banner disappears automatically.
- **Testing Requirements:** Register with email -> banner appears -> click resend -> toast shows success; Google sign-in -> no banner.

---

### IMP-13: Transaction & Authentication Emails (Priority: P2)
- **Current Issue:** Standard Firebase email templates lack professional branding and clarity.
- **Root Cause:** Default template text in Firebase Console.
- **Solution:**
  1. Provide structured, production-ready HTML and text templates for Firebase Console:
     - Email Verification: Clear call-to-action button, sender name "Expense Tracker Security", expiration notice.
     - Password Reset: Branded header, direct link, safety notice ("If you did not request this, ignore this email").
- **Testing Requirements:** Document templates and test password reset email delivery.

---

### IMP-14: Password Reset Experience (Priority: P1)
- **Current Issue:** Reset password flow was bare-bones with generic alert.
- **Root Cause:** Single prompt input in `AuthGate.jsx`.
- **Solution:**
  1. Dedicated, polished "Forgot Password" view inside `AuthGate.jsx`.
  2. Input validation for email format.
  3. Clear confirmation state: "Reset link sent! Please check your inbox and spam folder."
- **Testing Requirements:** Trigger reset from login -> verify confirmation view and return-to-login button.

---

### IMP-15: Google OAuth Verification Clearance (Priority: P1)
- **Current Issue:** App was flagged with verification warnings or user cap in Testing status.
- **Root Cause:** App was set to Testing status; scopes needed formal review.
- **Status: RESOLVED & VERIFIED!**
  - Google Auth Platform Audience is set to **In production** and **External**.
  - 0 Sensitive scopes, 0 Restricted scopes.
  - Verification is **NOT required** by Google!
- **Action Required:** Complete 3 non-sensitive scopes (`openid`, `userinfo.email`, `userinfo.profile`) in Data Access tab.

---

### IMP-16: Simplify Universal Login & Registration (Priority: P1)
- **Current Issue:** Auth modal had too many conflicting options and confusing terminology.
- **Root Cause:** Legacy multi-provider login UI.
- **Solution:**
  1. Single, elegant Auth card with:
     - Prominent "Sign in with Google" button with official Google SVG.
     - "or continue with email" divider.
     - Tab switcher: "Sign In" vs "Create Account".
     - Password visibility toggle (`Eye` / `EyeOff`).
     - Clear inline error messages.
- **Testing Requirements:** Test both Google sign-in and Email sign-in/registration flows.

---

### IMP-17: Application Back Navigation (Priority: P1)
- **Current Issue:** On mobile devices, pressing the hardware back button or browser back navigates away from the app instead of closing open modals.
- **Root Cause:** Modals did not manipulate browser history stack.
- **Solution:**
  1. In `App.jsx`, when any modal opens (`AddExpenseModal`, `LegalModal`, `NotificationsModal`, `ReleaseNotesModal`), push a modal state: `window.history.pushState({ modalOpen: true }, '')`.
  2. Listen to `window.addEventListener('popstate')`: if a modal is open, intercept the back event, close the modal, and prevent page navigation.
- **Testing Requirements:** Open Add Expense modal -> press browser Back button -> modal closes while user stays on dashboard.

---

### IMP-18: Release Notes & Version Info (Priority: P3)
- **Current Issue:** Users have no visibility into what changed or current app version.
- **Root Cause:** No release notes UI.
- **Solution:**
  1. Build `<ReleaseNotesModal>` detailing v1.1.0 release:
     - PWA mobile experience & quick entry FAB.
     - 4 New Themes (Slate, Violet, Midnight, Emerald).
     - Financial data integrity & instant delete recalculations.
     - Custom category manager.
     - Context-aware month navigation.
  2. Add "Version 1.1.0" pill in Settings and Footer that opens the modal.
- **Testing Requirements:** Click version pill in Settings -> modal opens with v1.1.0 release notes.

---

## Verification & QA Automation Plan
- **Vite Build Verification:** `npm run build --prefix client` -> Must pass with 0 warnings or errors.
- **Playwright Test Suite:** `npx playwright test` -> All end-to-end tests covering login, expense entry, deletion, reports, themes, and navigation must pass.
- **Final Deliverable:** Generate `docs/product-improvement-final-report.md`.
