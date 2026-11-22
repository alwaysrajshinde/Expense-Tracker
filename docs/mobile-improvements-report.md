# Mobile Improvements & Architectural Hardening Report

**Project:** Personal Expense Tracker  
**Target Viewports:** 320px, 360px, 375px, 390px, 414px, 430px (Mobile-First)  
**Release Version:** 2.4.0 (Inked Edition)  
**Date:** November 22, 2026  

---

## 1. Overview & Objective

This report details the comprehensive improvements made to the mobile edition of the Personal Expense Tracker. All modifications prioritize the mobile user journey—optimizing touch ergonomics, stabilizing async data handling, preventing unexpected UI resets, enforcing strict authentication security, and guaranteeing that historical and report figures reflect real-time sovereign ledger calculations.

---

## 2. Before & After Architectural Comparison

| Component / Area | Prior State (Before) | Hardened State (After) | User Impact |
| :--- | :--- | :--- | :--- |
| **Pre-Login Overview** (`PublicLanding.jsx`) | Cluttered landing with hardcoded mock metrics and crowded text | Clean 3-pillar overview (Zero-effort, Financial clarity, 100% Private) with direct Sign In / Sign Up CTAs and Theme Toggle | Instant clarity for new visitors on 320px–430px viewports |
| **Email Verification** (`Settings.jsx` & `AuthContext.jsx`) | Static non-interactive `<span>` badge; required manual logout/login to check | Interactive `<button>` calling `auth.currentUser.reload()`, immediate UI update with status toast feedback | Verification can be verified immediately with 1 tap |
| **Notification Read State** (`NotificationsModal.jsx`) | Transient React state (`useState(false)`), reset on page reload | Persistent `localStorage` storage under user ID key with individual & bulk mark-as-read buttons | Read status persists permanently across app restarts |
| **Historical Data Visibility** (`firestoreService.js`) | Queries limited strictly to single month, producing 1-item `available_months` | `getAvailableMonths(userId)` scans user records to aggregate all historical calendar month keys | All past months are immediately accessible |
| **Reports Month Navigation** (`Reports.jsx`) | Arrow buttons disabled when months array had 1 item; no direct jumping | Bidirectional calendar month arithmetic stepper + 1-tap Month Dropdown selector | Effortless month-by-month historical review |
| **Reports Calculations** (`sheetsBackend.js` & `Reports.jsx`) | Refunds/credits omitted or distorted total; subtab property access bugs | Explicit `total_income`, `net_balance` (Income - Spend), normalized `cat.total \|\| cat.amount` | 100% accurate financial analytics & subtabs |
| **Email Security** (`App.jsx`, `Header.jsx`) | Defaulted to verified via `?? true` fallback and default props | Strictly evaluates `Boolean(user?.emailVerified \|\| user?.isGoogleUser)` | Eliminates verification bypass vulnerability |
| **Add Expense Modal** (`AddExpenseModal.jsx`) | `useEffect` triggered on every categories array update, clearing typed amounts | `useRef` tracks modal lifecycle; user input is protected from background data refreshes | Zero data loss while entering transactions |
| **More Screen Navigation** (`Settings.jsx`) | Duplicate circular bell icon in header; Notifications buried | Duplicate bell removed; dedicated Notifications & Alerts card in Profile with live unread counter | Focused header and clear alert discoverability |
| **Localization & Languages** (`LanguageContext.jsx`) | English only, hardcoded strings | Full localization system: English, Hindi (हिन्दी), Spanish (Español), Marathi (मराठी) | Native language comfort for regional users |
| **Theme System** (`ThemeContext.jsx`) | Theme switcher inaccessible prior to logging in | Theme Toggle available on Public Landing and Auth card; persists across sessions | Comfortable viewing from first visit |
| **Login Clutter** (`AuthGate.jsx`) | Unwanted disclaimer link: `Seeing "Google hasn't verified this app"? Click here` and popup modal | Removed unwanted disclaimer text, link, and modal completely | Clean, modern, distraction-free login interface |

---

## 3. Deep Dive into Critical Fixes

### 3.1. Form Input Protection in `AddExpenseModal.jsx`
* **Root Issue:** The component's reset `useEffect` included `categories` and `quickCategories` in its dependency array. Whenever Firestore synchronized or background category fetches returned a fresh array reference, the effect re-ran and called `setAmount('')` and `setDescription('')`. Users typing on slow mobile connections had their entered data unexpectedly erased.
* **Hardened Architecture:** Implemented a `wasOpenRef` lifecycle tracker:
  ```javascript
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Initialize only upon initial modal opening
      ...
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, editingTransaction, initialDate]);
  ```
  Background category or budget updates no longer wipe out user input.

### 3.2. Dynamic Historical Month Aggregation in `firestoreService.js`
* **Root Issue:** `getDashboardData` queried `where('month_key', '==', monthKey)` and passed only those records to `computeDashboardFromTransactions`. Consequently, `available_months` contained only `[monthKey]`, disabling both previous and next buttons.
* **Hardened Architecture:** Added `getAvailableMonths(userId)`:
  ```javascript
  export async function getAvailableMonths(userId) {
    if (!userId) return [getLocalMonthKey()];
    const q = query(collection(db, 'users', userId, 'transactions'));
    const snap = await getDocs(q);
    const monthsSet = new Set();
    snap.forEach(doc => {
      const data = doc.data();
      if (data.month_key) monthsSet.add(data.month_key);
      else if (data.date) monthsSet.add(data.date.slice(0, 7));
    });
    return Array.from(monthsSet).sort();
  }
  ```
  Both `getDashboardData` and `getReports` now receive the full array of historical months.

### 3.3. Elimination of False-Positive Verification State
* **Root Issue:** `App.jsx` rendered header components with `emailVerified={user?.emailVerified ?? true}`. For unverified users where `user.emailVerified === false`, `false ?? true` evaluated to `false`, but where `emailVerified` was `undefined` or null, it fell back to `true`.
* **Hardened Architecture:**
  - Standardized verification logic to: `emailVerified={Boolean(user?.emailVerified || user?.isGoogleUser)}`.
  - Updated `Header.jsx` and `WindowsHeader.jsx` default props to `emailVerified = false`.
  - Removed internal email bypasses in `AuthContext.jsx`.

---

## 4. Mobile Ergonomics & Touch Target Enforcement

All interactive elements across mobile screens were updated to strictly comply with mobile touch guidelines (minimum 44px × 44px active touch area):
- **Navigation Items:** List rows in `Settings.jsx` use `min-h-[48px]`, generous horizontal padding (`p-4`), and rounded-3xl cards.
- **Form Controls:** Amount inputs utilize large, readable text (`text-xl font-bold`) and minimum 48px height.
- **Buttons & FAB:** The elevated Quick Add Floating Action Button is 52px × 52px with a 4px ring buffer to prevent accidental navigation clicks.
- **Sub-Modals:** All bottom sheets and dialogs feature `max-h-[90vh]`, `overflow-y-auto`, and top-right close buttons with 44px tap targets.

---

*Report generated and validated locally. Strict Git rule preserved: 0 commits or pushes to remote repository.*
