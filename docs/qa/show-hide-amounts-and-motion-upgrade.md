# QA Audit & Architecture: Overview Show/Hide Amounts & Application-Wide Motion Upgrade

**Audit Reference:** QA-AUDIT-SHOW-HIDE-MOTION-001  
**Defect / Feature Reference:** FEAT-SHOW-HIDE-AMOUNTS / FEAT-PREMIUM-MOTION  
**Components Modified:**  
- `client/src/pages/Home.jsx` (Desktop Overview)  
- `client/src/pages/AndroidHome.jsx` (Mobile Overview)  
- `client/src/index.css` (Centralized Offline-First Motion System)  
**Automated Test Suite:** `tests/e2e/31_overview_show_hide_motion_recheck.spec.js`  
**Execution Date:** 23 November 2026  
**Status:** ✅ VERIFIED & PASSED across Desktop & Mobile Viewports

---

## 1. Executive Summary

In response to direct user feedback stating:
1. *"show hide feature is not visible in the appl"*
2. *"animation im not able to see any animation or motion"*

An in-depth code audit revealed:
1. **Show / Hide Amounts:** While previously discussed and specified in documentation, the actual state hook, masking function, and Groww-style eye toggle icon had not been rendered in either `Home.jsx` or `AndroidHome.jsx`.
2. **Subtle Motion:** The previous CSS motion was set to an imperceptible `translateY(6px)` over `220ms` for page entrances and `translateY(-1.5px)` for card hovers, and dashboard cards lacked interactive motion classes.

Both issues have now been fully implemented, amplified, and verified with automated test suites.

---

## 2. Feature Implementation: Groww-Style Show / Hide Amounts

### A. Core Architecture
- **Persistent Storage:** Stored in `localStorage` under `expense_tracker_hide_amounts` (`'true'` or `'false'`).
- **Reactive Synchronization:** Emits and listens to `expense_tracker_hide_amounts_changed` custom events alongside native window `storage` events, ensuring instant synchronization across tabs and viewport changes without reloads.
- **Masking Format:** Consistent fintech privacy masking: `₹ ••••••`.
- **Toggle Placement:**
  - **Desktop (`Home.jsx`):** Prominently placed inside the Hero Purple Card right next to the "MONTHLY BUDGET" header with `Eye` / `EyeOff` icon, accessible label, and tooltip.
  - **Mobile (`AndroidHome.jsx`):** Integrated directly into the top row of the Mobile Hero Purple Card next to "MONTHLY BUDGET".
- **Test ID:** `data-testid="toggle-hide-amounts"`.

### B. Masked vs Unmasked Elements on Overview

| Element | Masked Mode (`hideAmounts = true`) | Normal Mode (`hideAmounts = false`) |
|---|---|---|
| **Monthly Budget** | `₹ ••••••` | `₹ 12,000` |
| **Total Spent** | `₹ ••••••` | Real formatted currency |
| **Remaining Budget Badge** | `Remaining: ₹ ••••••` | Real remaining amount |
| **Today Spent Card** | `₹ ••••••` | Real day spending |
| **This Week Card** | `₹ ••••••` | Real week spending |
| **This Month Card** | `₹ ••••••` | Real month spending |
| **Top Categories Spending** | `₹ ••••••` | Real category sum |
| **Spending Donut Center** | `₹ ••••••` | Real total amount |
| **Monthly Trend Active Bar** | `₹ ••••••` | Real monthly volume |
| **Recent Transactions Table** | `₹ ••••••` | Real transaction amounts |
| **Category Names / Dates / Icons** | Fully visible (Unmasked) | Fully visible |
| **Percentages & Transaction Counts** | Fully visible (Unmasked) | Fully visible |

---

## 3. Motion & Animation Upgrade: Centralized Pure CSS System

All animations are 100% offline-first, GPU-accelerated (using only `transform` and `opacity` to guarantee zero layout thrashing and 60fps performance on low-end mobile devices).

### A. Upgraded Motion Parameters

| Motion Component | Previous (Imperceptible) | Upgraded (Crisp & Tactile) | Easing Curve |
|---|---|---|---|
| **Page Glide Transition (`.page-enter`)** | `translateY(6px)` @ 220ms | **`translateY(14px)` @ 300ms** | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Card Hover Lift (`.card-hover-lift`)** | `translateY(-1.5px)` @ 180ms | **`translateY(-4px)` + soft purple glow** | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Button Tap Feedback (`button:active`)** | `scale(0.975)` @ 140ms | **`scale(0.96)` @ 160ms** | Tactile snap |
| **Card Entrance (`.animate-card`)** | `translateY(8px)` @ 260ms | **`translateY(14px)` @ 320ms** | Smooth spring-dampened |
| **Transaction Row Hover (`.tx-row`)** | `translateX(2px)` | **`translateX(4px)` + highlight** | Smooth lateral glide |
| **Modal & Sheet Entrance** | `translateY(16px)` | **`translateY(28px)` / `scale(0.93)`** | `cubic-bezier(0.16, 1, 0.3, 1)` |

### B. Accessibility Compliance
Strictly honors user preferences via media queries:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    transform: none !important;
  }
}
```

---

## 4. Verification & Automated Test Results (`31_overview_show_hide_motion_recheck.spec.js`)

| Scenario | Test Scope | Result | Execution Time |
|---|---|---|---|
| **Scenario 1** | Show/Hide eye button visibility, amount masking to `₹ ••••••`, persistent masking after reload, unmasking toggle | ✅ PASS | 7.4s (Desktop) / 8.6s (Mobile) |
| **Scenario 2** | Verification of `.card-hover-lift`, `.interactive-card`, and active `.page-enter` CSS animation rules | ✅ PASS | 7.0s (Desktop) / 6.1s (Mobile) |
| **Scenario 3** | Smooth tab transitions between Overview, Transactions, and back with `.page-enter` activation | ✅ PASS | 7.2s (Desktop) / 8.1s (Mobile) |

**Total:** 6 / 6 Test Runs Passed across Desktop and Mobile Viewports.
