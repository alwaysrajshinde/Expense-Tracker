# Mobile Application Issues Audit & Technical Analysis

**Application:** Personal Expense Tracker (PWA)  
**Version:** 2.4.0 (Inked v2.4.0-inked)  
**Date:** November 22, 2026  
**Target Environment:** Mobile Devices (iOS Safari, Android Chrome, Installed PWA)  
**Audit Scope:** 18 Critical UI/UX, Functional, Security, and Reporting Issues  

---

## Executive Summary

A comprehensive quality audit was conducted targeting the mobile experience of the Personal Expense Tracker application across viewport resolutions ranging from 320px to 430px. The audit identified 18 critical areas spanning authentication, session verification, historical data visibility, notification persistence, mathematical calculations in reports, touch targets, and visual layout harmony.

Every issue was traced to its root cause in the React, Vite, Firebase, and Firestore architecture, repaired locally with zero data loss, and verified through automated Playwright mobile test suites.

---

## Detailed Root Cause Analysis (18 Audited Areas)

### Issue 1: Pre-Login Overview Page Clutter & Unnecessary Elements
* **Symptoms:** First-time visitors were presented with cluttered statistics, marketing claims, and complex components before understanding the app's core utility.
* **Root Cause:** `PublicLanding.jsx` contained hardcoded metric counters and promotional demo blocks that overwhelmed mobile users on narrow screens.
* **Resolution:** Re-architected `PublicLanding.jsx` into a clean, modern, mobile-first showcase featuring:
  - 3 clear pillars: Zero-Effort Tracking, Instant Financial Clarity, and 100% Private & Sovereign.
  - Prominent "Sign In" and "Get Started" call-to-actions.
  - An accessible Theme Toggle in the top navigation bar.
  - `AuthGate.jsx` defaulted to show this overview first, with a 1-tap transition to the Sign In card.

---

### Issue 2: Email Verification "Tap to Check" Inactive
* **Symptoms:** Clicking "Unverified · Tap to check" on the More page did nothing; the user was forced to log out and log in again to reflect email verification.
* **Root Cause:** In `client/src/pages/Settings.jsx` (line 1159), the status pill was rendered as a static `<span>` with no `onClick` handler. Furthermore, `checkVerificationStatus` was not hooked to the button.
* **Resolution:** 
  - Converted the static badge into an interactive `<button>` with an active touch target.
  - Connected it to `checkVerificationStatus` in `AuthContext.jsx`, which calls `auth.currentUser.reload()`, inspects `firebaseUser.emailVerified`, updates user state, and displays toast feedback.
  - Added a dedicated "Check Verification Status" button alongside "Resend Verification Link" in the Security modal.

---

### Issue 3: Notification "Mark as Read" State Lost on Refresh
* **Symptoms:** When a user clicked "Mark All Read" or cleared notifications, refreshing the page caused all notifications to reappear as unread.
* **Root Cause:** `NotificationsModal.jsx` stored cleared/read state in a component-level React `useState(false)`. On browser reload, the state reset to `false`.
* **Resolution:**
  - Added persistent `localStorage` storage under key `expense_tracker_read_notifs_${userId}`.
  - Added individual "Mark as Read" checkmark buttons on each notification item.
  - Integrated "Mark all read" to record all active notification IDs into persistent storage.
  - Differentiated unread vs. read notifications visually with badge indicators and tinted cards.

---

### Issue 4: Historical Transactions / Previous Months Invisible Across App
* **Symptoms:** Transactions from previous calendar months were invisible in the Dashboard and Reports. Month navigation was locked to the current month.
* **Root Cause:** In `firestoreService.js`, `getDashboardData` queried Firestore using `where('month_key', '==', monthKey)` exclusively. When calculating available months, it inspected only the transactions returned from that single month query. As a result, `available_months.length` was always 1, disabling previous/next navigation buttons.
* **Resolution:**
  - Created `getAvailableMonths(userId)` in `firestoreService.js` that scans user transaction documents to extract all unique `month_key` values.
  - Updated `getDashboardData` and `getReports` to pass the complete user `available_months` array.

---

### Issue 5: Reports Page Calculations & Month Navigation Locked
* **Symptoms:** Month navigation arrows on the Reports page were disabled even when historical transactions existed. Subtabs (Categories, Payment Modes) occasionally showed empty labels or ₹0 amounts. Net balance was absent.
* **Root Cause:** 
  1. `available_months` array was passed as empty or single-element from the backend query.
  2. Navigation carousel only supported adjacent indices in a fixed array rather than calendar month arithmetic.
  3. `sheetsBackend.js` did not distinguish income/refunds from debits in reports calculation.
  4. In `Reports.jsx`, category breakdown accessed `cat.total` whereas some objects used `cat.amount`, causing blank values.
* **Resolution:**
  - Rewrote month stepping in `Reports.jsx` to navigate calendar months (`YYYY-MM`) bidirectionally without requiring contiguous array indices.
  - Added a direct `<select>` Month Dropdown in the carousel bar for 1-tap historical jumping.
  - Added 4 summary stat cards: Total Spend, Income & Credits, Net Cashflow, Remaining Budget.
  - Normalized property accesses: `cat.total || cat.amount` and `pm.payment_mode || pm.mode`.

---

### Issue 6: Email Verification Security Flaw: Verified Without Verification Link
* **Symptoms:** Accounts created with email and password appeared as "Verified" immediately, without clicking the verification email link.
* **Root Cause:** In `client/src/App.jsx` lines 401 & 600, the prop was passed as `emailVerified={user?.emailVerified ?? true}`, evaluating falsy/null values to `true`. Furthermore, `Header.jsx` and `WindowsHeader.jsx` had default prop `emailVerified = true`, and `AuthContext.jsx` had bypasses.
* **Resolution:**
  - In `App.jsx`, changed prop binding to strictly evaluate: `emailVerified={Boolean(user?.emailVerified || user?.isGoogleUser)}`.
  - In `Header.jsx` and `WindowsHeader.jsx`, set default prop to `emailVerified = false`.
  - In `AuthContext.jsx`, removed automatic verification bypasses.

---

### Issue 7: Google Sheets "Coming Soon" Misaligned UI
* **Symptoms:** Google Sheets export button had redundant labels ("Coming Soon" and "Upcoming") that clipped on narrow screens.
* **Root Cause:** Redundant nested span tags and uneven flex padding in `Settings.jsx`.
* **Resolution:**
  - Cleaned up the list item to display a single, neat "Coming Soon" pill badge.
  - Set minimum touch height to 48px.
  - In `GoogleSheetsExportModal.jsx`, styled the preview notice banner and provided 1-click fallback export buttons (Excel / JSON).

---

### Issue 8: Missing Theme Selector on Pre-Login & Login Screens
* **Symptoms:** Users could not switch themes before logging in; dark mode users were blinded by bright light mode on the landing page.
* **Root Cause:** Theme toggle was only accessible in the inner application header and Settings page.
* **Resolution:**
  - Added an accessible Theme Toggle button to the top navigation of `PublicLanding.jsx`.
  - Added a Theme Toggle button to the header of `AuthGate.jsx`.
  - Connected both to `ThemeContext`, persisting theme preferences across sessions.

---

### Issue 9: Login Screen "OR" Separator Misaligned
* **Symptoms:** The "OR" divider separating Google Sign In and Email/Password fields had uneven spacing and misaligned dividing lines.
* **Root Cause:** Used asymmetrical margins and non-flex centering.
* **Resolution:** Centered using `flex items-center my-3.5` with two equal `flex-1 border-t border-slate-200 dark:border-white/10` borders and an evenly padded label.

---

### Issue 10: Removal of Unwanted "Google hasn't verified this app" Link on Login Screen
* **User Feedback & Requirement:** The user explicitly noted: *"Google OAuth 'Unverified App' Warning Analysis: its not the warning what i have to say that o the login pgae this is the line something so remove that this loooks inwantd now"*. The unwanted text link and helper popup on the login page needed to be permanently removed to keep the login view clean and uncluttered.
* **Root Cause:** In `AuthGate.jsx`, an unwanted link `<button onClick={() => setShowGoogleHelp(true)}>...Seeing "Google hasn't verified this app"? Click here</button>` and an accompanying guidance popup modal (`showGoogleHelp`) were rendered beneath the Google sign-in button.
* **Resolution:** 
  - Permanently removed the text link and `HelpCircle` icon from `AuthGate.jsx`.
  - Removed the `showGoogleHelp` state variable and deleted the entire guidance popup modal.
  - The login screen now presents an uncluttered, modern Google Sign-In button with zero unwanted disclaimer text.

---

### Issue 11: Mobile Touch Targets Too Small
* **Symptoms:** Sub-modal buttons, dropdowns, and month navigation arrows were hard to tap accurately on small mobile viewports (320px–375px).
* **Root Cause:** Elements lacked explicit `min-h-[44px]` or `min-h-[48px]` touch targets.
* **Resolution:** Enforced `min-h-[44px]` on all interactive buttons, inputs, category selectors, and navigation bars.

---

### Issue 12: Duplicate Notification Controls in More Section
* **Symptoms:** A circular bell icon was displayed in the top right of the More screen header, duplicating the main app header bell.
* **Root Cause:** Redundant `<button aria-label="Notifications">` in `Settings.jsx` mobile header.
* **Resolution:** Removed the circular bell icon from the More screen header, leaving a clean, focused title and subtitle.

---

### Issue 13: Move Notifications Cleanly into Profile Section
* **Symptoms:** Notifications lacked a dedicated, discoverable entry point within user settings.
* **Root Cause:** Notifications were only reachable via the top header bell.
* **Resolution:** Added a dedicated "Notifications & Alerts" card in the Profile section of More, complete with an unread badge counter showing active alerts.

---

### Issue 14: More Page Mobile UI & Grouping Audit
* **Symptoms:** Settings items had uneven margins, inconsistent card styles, and crowded text.
* **Root Cause:** Uneven padding across list buttons and mixed corner radii.
* **Resolution:** Standardized list items into clean, rounded-3xl cards categorized into Manage Finances, Personalization, Data Management, and Account & Support with consistent dark violet styling.

---

### Issue 15: Standard 15 Categories & Data-Safe Management
* **Symptoms:** Category lists could become bloated or create orphaned transactions upon deletion.
* **Root Cause:** Lack of standard initialization for new accounts and lack of transaction reassignment on deletion.
* **Resolution:**
  - Enforced 15 standard, non-overlapping categories in `firestoreService.js` (`STANDARD_DEFAULT_CATEGORIES`).
  - `CategoryManagerModal.jsx` supports reassigning transactions or archiving categories before deletion, preventing data loss.

---

### Issue 16: Multi-Language Selection in Settings
* **Symptoms:** Application lacked localization options.
* **Root Cause:** All strings were hardcoded in English.
* **Resolution:**
  - Created `LanguageContext.jsx` supporting 4 languages: English, Hindi (हिन्दी), Spanish (Español), and Marathi (मराठी).
  - Added a dedicated Language sub-modal and selector row in Settings on both mobile and desktop.
  - Stored language preference in `localStorage`.

---

### Issue 17: Theme Consistency Across All 6 Palettes
* **Symptoms:** Dark Violet, Light, Midnight, Ocean Blue, Emerald, and Rose palettes had slight contrast inconsistencies on mobile inputs.
* **Root Cause:** Hardcoded hex values in select input classes.
* **Resolution:** Audited CSS custom properties and Tailwind dark classes, ensuring WCAG AA contrast compliance across all 6 themes.

---

### Issue 18: Mobile Viewport Regression Testing (320px to 430px)
* **Symptoms:** Horizontal overflow, clipping text, or cut-off buttons on narrow 320px–360px viewports.
* **Root Cause:** Unconstrained flex widths and excessive horizontal padding.
* **Resolution:** Applied `w-full max-w-full`, responsive padding (`px-3 sm:px-6`), and verified across 5 standard viewport widths with zero horizontal scrollbar triggers.

---

*Document compiled and verified locally. Strict Git rule preserved: 0 commits or pushes to remote repository.*
