# Real User Mobile Journey & Usability Report
**Application:** Personal Expense Tracker Mobile Edition  
**Version:** v2.4.1  
**Audit Perspective:** Real Mobile User & Senior QA Automation  
**Date:** November 22, 2026

---

## 1. Executive Summary

This report documents an end-to-end user experience audit conducted strictly from the perspective of an authentic mobile phone user. Rather than treating mobile testing as a downscaled desktop check, testing was performed across mobile viewports (320px iPhone SE, 360px Galaxy S8, 375px iPhone 13 mini, 393px Pixel 7, and 430px iPhone 14 Pro Max) with mobile interaction patterns (tap targets, touch ergonomics, bottom navigation, and modal sheets).

Every user journey from first app launch to daily expense logging, budget monitoring, history management, reporting, category customization, and updates was evaluated. All discovered points of friction and confusion were diagnosed down to root cause, resolved, and verified.

---

## 2. Comprehensive Mobile Journey Walkthrough

### Stage 1: First-Time User Experience & Onboarding
* **Journey Explored:** New user lands on the mobile application, registers a new account, and explores initial setup.
* **Friction Discovered:**
  - Password length requirement in the registration form had a mismatch: the input placeholder displayed `"At least 6 characters"`, but client validation enforced 8+ characters plus a number or symbol. New users entering a 6-character password encountered an unexpected rejection error.
* **Resolution Implemented:**
  - Updated the password input label to explicitly state `Password (min 8 chars, with number/symbol)` and the placeholder to `"At least 8 chars with number/symbol"`.
  - Streamlined the post-registration transition into the guided onboarding tour.

---

### Stage 2: Daily Expense Logging & Quick Entry
* **Journey Explored:** User opens the app to log quick daily expenses (coffee, lunch, groceries) and income/refunds.
* **Friction Discovered:**
  - Logging expenses from yesterday required tapping the native mobile date picker and navigating through the calendar wheel.
  - The amount input field hardcoded `₹` regardless of whether the user chose `$`, `€`, or `£` in Profile Settings.
  - Credit entries were labeled exclusively as `Refund / Return`. Users wanting to log freelance income, salary, or cashback were confused. When the toggle was switched to credit, the save button still displayed "Save Expense".
* **Resolution Implemented:**
  - Added 1-tap **`[ Today ]`** and **`[ Yesterday ]`** pills right above the Date input for instantaneous date selection.
  - Connected the currency symbol directly to user settings (`currency={settings.currency || '₹'}`).
  - Renamed the toggle to **`Income / Refund`**, dynamically updating the modal title to `Add Income / Refund` and the action button to `Save Income / Refund` (or `Update Income / Refund`).

---

### Stage 3: Budget Tracking & Quick Adjustments
* **Journey Explored:** User reviews their monthly budget on the Home dashboard card and wants to adjust it.
* **Friction Discovered:**
  - When a monthly budget was set (`budget > 0`), the hero card rendered the budget amount as plain, non-interactive text. Users naturally tapped the budget to adjust it, but nothing happened. They had to leave the Home screen, navigate to More, locate Budget, and adjust it there.
* **Resolution Implemented:**
  - Made the Monthly Budget amount on the Hero Card an interactive touch target with an `Edit` badge that directly launches the Budget configuration sheet.

---

### Stage 4: Transaction History & Management
* **Journey Explored:** User audits their past expenses, filters by month, category, or payment mode, and cleans up records.
* **Friction Discovered:**
  - The "Recent Activity" list on the Android Home card was non-clickable.
  - Resetting multiple active filters (e.g. search query + category + payment mode) required clearing 3 separate dropdowns and text inputs manually.
  - In the Delete Confirmation dialog, tapping the blurred background did not dismiss the dialog.
  - All credit entries were badged as "Refund", even when the category or note indicated salary or income.
* **Resolution Implemented:**
  - Made Recent Activity items directly clickable, immediately opening the Edit modal for that transaction.
  - Added a 1-tap **`Reset All Filters`** bar whenever search or filter dropdowns are active.
  - Added a backdrop click handler (`onClick={() => setDeleteConfirmId(null)}`) to dismiss the delete confirmation.
  - Smart-badged credit entries: displays **`Income`** for income, freelance, salary, or cashback items, and **`Refund`** for returns.

---

### Stage 5: Reports & Accounting Analytics
* **Journey Explored:** User analyzes spending breakdowns, trends, and yearly summaries.
* **Friction Discovered:**
  - On narrow 320px–360px phones, the "Select Accounting Year:" title and year pill buttons were forced into a tight horizontal row, causing wrapping clipping.
* **Resolution Implemented:**
  - Converted the Year Selector Bar into a responsive stacked layout (`flex flex-col sm:flex-row gap-2.5` with `flex-wrap` pills) for effortless thumb tapping.

---

### Stage 6: Category Management & Personalization
* **Journey Explored:** User creates custom categories with unique icons and colors.
* **Friction Discovered:**
  - In the "Add Custom Category" form, 12 color swatch circles were positioned in a single nowrap flex row, overflowing beyond the screen edges on narrow devices.
* **Resolution Implemented:**
  - Added `flex-wrap` with comfortable touch padding (`flex flex-wrap items-center gap-2`), keeping all 12 swatches cleanly visible.

---

### Stage 7: Data Export & Google Sheets Integration
* **Journey Explored:** User looks to export their data or sync with Google Sheets.
* **Friction Discovered:**
  - Users expect clear transparency regarding upcoming integrations.
* **Resolution Implemented:**
  - Marked Google Sheets direct sync as "Coming Soon / Upcoming" with a clean preview card explaining future automated bi-directional synchronization.
  - Excel and JSON backups remain 100% functional for immediate offline export.

---

### Stage 8: Updates & Application Transparency
* **Journey Explored:** User verifies app version and recent feature releases.
* **Resolution Implemented:**
  - Updated app version to `v2.4.1` with exact release timestamp (`November 22, 2026 at 01:57 PM`).
  - Added an in-app update notification item with an active notification dot and direct link to Release Notes.
