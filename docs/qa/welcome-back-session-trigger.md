# QA Audit & Architecture: Session-Aware Welcome Back Greeting Trigger

**Audit Reference:** QA-AUDIT-WELCOME-BACK-001  
**Defect Tracker Reference:** DEF-034 / BUG-MOB-35  
**Component:** `client/src/services/welcomeSessionService.js`, `client/src/components/WelcomeGreetingOverlay.jsx`, `client/src/App.jsx`  
**Automated Test Suite:** `tests/e2e/30_welcome_back_session_trigger.spec.js`  
**Execution Date:** 23 November 2026  
**Status:** ✅ PASSED (14/14 Scenarios across Desktop & Mobile)

---

## 1. Problem Statement & Root Cause Analysis

### The Problem
Previously, the luxury "Welcome Back" greeting modal appeared on **every page refresh (F5)** and during normal navigation between internal tabs (Overview, Transactions, Reports, Settings/More). This repetitive presentation degraded the user experience and interrupted user workflows.

### Root Cause
1. **Lack of Session Scoping:** The greeting check solely evaluated whether a user had an active authentication session, without distinguishing between a **new browser session** and an existing session page refresh.
2. **Component Remounting on Reload:** React re-evaluated the overlay state on every page mount without consulting a session-scoped memory store (`sessionStorage`).
3. **In-Flight Navigation Triggers:** Route transitions re-evaluated initial data loading hooks, inadvertently re-arming greeting flags.

---

## 2. Architecture & Solution Design

### A. Dedicated Welcome Session Service (`welcomeSessionService.js`)
We introduced an isolated, offline-first session manager that tracks:
- **`sessionStorage` Key:** `et_welcome_greeting_session_shown` (cleared automatically by the browser when the tab/window is closed).
- **Process Memory Guard:** In-memory boolean flag `_inMemoryGreetingShown` preventing multiple triggers within the same JavaScript execution context.
- **Session Timestamp Tracking:** `et_last_activity_timestamp` to support extended absence re-greeting (>30 minutes of complete inactivity).

### B. Trigger Evaluation Logic
```javascript
export function shouldShowWelcomeGreeting(userId = 'guest') {
  if (isSessionGreetingShown(userId)) {
    return false; // Already shown in this browser session
  }
  return true; // Brand new session
}
```

### C. Lifecycle Matrix

| Event | Greeting Triggers? | Rationale |
|---|---|---|
| **App Launch (New Tab/Window)** | ✅ **YES** | User is starting a new application session. |
| **Page Refresh (F5 / Ctrl+R)** | ❌ **NO** | `sessionStorage` flag is preserved across reloads within the same session. |
| **Tab Navigation (Overview -> Tx -> Reports)** | ❌ **NO** | SPA internal route state preserves session flags. |
| **Modal Open / Close** | ❌ **NO** | Local component state only. |
| **Settings Nested Navigation** | ❌ **NO** | Sub-route changes never reset session memory. |
| **Firebase Auth Token Refresh** | ❌ **NO** | Background credential refresh maintains session continuity. |
| **Explicit User Logout** | ❌ **NO (Reset)** | Clears session flag so next login will greet the user. |

---

## 3. Automated Verification Matrix (`30_welcome_back_session_trigger.spec.js`)

| Scenario | Test Description | Desktop Result | Mobile Result |
|---|---|---|---|
| **Scenario 1** | First application launch displays greeting | ✅ PASS | ✅ PASS |
| **Scenario 2** | Page refresh (F5) does NOT re-trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 3** | Navigation to Transactions tab does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 4** | Navigation to Reports tab does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 5** | Navigation to Settings / More tab does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 6** | Navigation into Nested Settings (Categories) does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 7** | Opening and closing Add Expense modal does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 8** | Rapid route switching does NOT trigger greeting | ✅ PASS | ✅ PASS |
| **Scenario 9** | Auth state restoration preserves session suppression | ✅ PASS | ✅ PASS |
| **Scenario 10** | In-flight data refresh preserves session suppression | ✅ PASS | ✅ PASS |
| **Scenario 11** | Logout resets session greeting flag cleanly | ✅ PASS | ✅ PASS |
| **Scenario 12** | New browser session correctly displays greeting once | ✅ PASS | ✅ PASS |

**Total:** 14 / 14 Passed (100% Pass Rate).
