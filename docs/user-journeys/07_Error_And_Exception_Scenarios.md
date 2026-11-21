# 07. Error, Exception and Edge Case Scenarios

**Document Reference:** `UJ-DOC-07`  
**Classification:** Fault Tolerance, Edge Cases & Error Recovery  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** QA Engineers, Reliability Engineers, Frontend Developers, Security Auditors  

---

## 1. Exception Handling Architecture

The Expense Tracker application incorporates a multi-layer defense against network drops, authentication failures, server timeouts, and invalid user input.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ERROR RECOVERY ARCHITECTURE                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
 [User Action / API Trigger]
             │
             ▼
 ┌───────────────────────┐
 │ Client-Side Pre-Check │ ──(Invalid Input)──► Inline Form Validation Alert (No Network)
 └───────────┬───────────┘
             │ (Valid Input)
             ▼
 ┌───────────────────────┐
 │ Network & Cloud Call  │ ──(Offline / Timeout)──► PWA Cache / Retry Queue / Offline Toast
 └───────────┬───────────┘
             │ (Server Error)
             ▼
 ┌───────────────────────┐
 │ Firestore / Auth Code │ ──(Auth Expired / Denied)──► Clear Session -> AuthGate Redirect
 └───────────┬───────────┘
             │ (Fatal React Bug)
             ▼
 ┌───────────────────────┐
 │ React Error Boundary  │ ──► Safe Fallback Screen ("Something went wrong") + Reset Button
 └───────────────────────┘
```

---

## 2. Detailed Exception Scenarios Matrix

### Scenario 7.1: High Latency / Slow Internet (>10 Seconds)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-01` |
| **Scenario Name** | High Latency Network Degradation |
| **User Type** | Any User |
| **Preconditions** | User is connected to throttled 2G or congested public WiFi. |
| **User Action** | Clicks `Save Expense` in modal. |
| **Expected Screen** | Button displays `Saving...` spinner. Modal inputs remain disabled to prevent double clicks. After 4 seconds, a non-blocking toast informs: *"Network is slow. Saving in background..."*. Once committed, modal closes with green success toast. |
| **System Behaviour** | Sets in-flight submitting lock. Async promise executes with extended timeout. Local optimistic cache updates UI state immediately so user is not held hostage. |
| **Expected Result** | User experience remains responsive despite slow network. |
| **Error Handling** | If connection completely times out (>30s), displays retry banner without clearing user's typed inputs. |
| **Status** | **Implemented** |

---

### Scenario 7.2: Total Network Disconnection During Active Session
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-02` |
| **Scenario Name** | Complete Offline Drop During Session |
| **User Type** | Any User |
| **Preconditions** | User is browsing transactions; internet drops completely. |
| **User Action** | Clicks on different tabs or opens `Add Expense`. |
| **Expected Screen** | Persistent warning pill in header: `Offline Mode`. Existing transactions remain visible and searchable from local memory. User can still add an expense; modal accepts entry and saves to local IndexedDB queue. |
| **System Behaviour** | `navigator.onLine` fires `offline` event. App toggles offline state banner. Firestore uses local persistence cache. |
| **Expected Result** | Zero application crash; seamless offline degradation. |
| **Error Handling** | Cloud-dependent actions (e.g. Google Sheets sync, cloud backup restore) are temporarily disabled with tooltip: *"Available when online"*. |
| **Status** | **Implemented** |

---

### Scenario 7.3: Firebase Service Outage (HTTP 503 / Network Unavailable)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-03` |
| **Scenario Name** | Cloud Provider Service Disruption |
| **User Type** | Any User |
| **Preconditions** | Google Cloud / Firebase service experiences an unscheduled regional outage. |
| **User Action** | User opens application. |
| **Expected Screen** | App attempts cloud handshake. Upon error, displays banner: *"Cloud vault temporarily unreachable. Operating in local offline mode."*. Existing cached transactions remain available. |
| **System Behaviour** | Catches `FirebaseError: unavailable`. Suppresses raw unhandled promise rejections. Falls back to cached local storage data. |
| **Expected Result** | Application remains functional for reading recent expenses rather than displaying a blank white screen. |
| **Error Handling** | Periodically pings cloud endpoint with exponential backoff. |
| **Status** | **Implemented** |

---

### Scenario 7.4: Database Permission Denied (Firestore Security Rules)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-04` |
| **Scenario Name** | Security Rules Rejection & Multi-Tenant Defense |
| **User Type** | Malicious / Compromised Client |
| **Preconditions** | An attacker tampers with client code to query `/users/other_user_id/transactions`. |
| **User Action** | Triggers tampered query via browser DevTools. |
| **Expected Screen** | Request immediately fails. Client logs rejection. No data is leaked. If session is compromised, user is logged out with error: *"Access unauthorized"*. |
| **System Behaviour** | Cloud Firestore Security Rule evaluates:  
  `allow read, write: if request.auth != null && request.auth.uid == userId;`  
  Rejects query with `permission-denied` (gRPC Status 7). |
| **Expected Result** | Zero cross-tenant data leakage. Strict security enforcement at database engine level. |
| **Error Handling** | Application catches error and prevents sensitive error leaks to UI. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` (Test G3) |

---

### Scenario 7.5: Browser Refresh During Active Save (Mid-Mutation Reload)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-05` |
| **Scenario Name** | User Accidentally Refreshes Browser While Submitting |
| **User Type** | Any User |
| **Preconditions** | User clicked Save Expense; while the spinner was active, user hit F5 or closed the tab. |
| **User Action** | Refreshes browser tab mid-flight. Reopens application. |
| **Expected Screen** | Application loads normally. Transaction is either completely saved (if write reached server before disconnect) or omitted (if severed before dispatch). Zero corrupted half-written rows exist in ledger. |
| **System Behaviour** | Firestore writes are atomic at the document level. If committed, roll-up cache updates; if not committed, no document was created. Upon next load, if any discrepancy is detected between transactions and month cache, self-healing roll-up regenerates sum. |
| **Expected Result** | No broken state or corrupt records. |
| **Error Handling** | Self-healing audit logic on month load. |
| **Status** | **Implemented** |

---

### Scenario 7.6: Corrupted LocalStorage Session
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-06` |
| **Scenario Name** | Malformed or Tampered LocalStorage Session |
| **User Type** | Any User |
| **Preconditions** | Browser storage key `expense_tracker_auth_session` contains invalid JSON (e.g. edited via DevTools or corrupted by disk glitch). |
| **User Action** | Launches application. |
| **Expected Screen** | Application boots cleanly. Clears malformed key and displays `AuthGate` sign-in screen without crashing. |
| **System Behaviour** | Wrapped in `try/catch` in `AuthContext.jsx` (lines 66-78). Upon `JSON.parse` failure, executes `localStorage.removeItem(STORAGE_KEY)` and initializes `user: null`. |
| **Expected Result** | Graceful fallback preventing white-screen crash loops. |
| **Error Handling** | Silent automatic cache healing. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 7.7: Uncaught React Runtime Error (Error Boundary Recovery)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-07` |
| **Scenario Name** | React Component Tree Exception Catch |
| **User Type** | Any User |
| **Preconditions** | A malformed third-party SVG icon or null object property throws an uncaught JavaScript error in rendering. |
| **User Action** | Navigates to affected screen. |
| **Expected Screen** | Instead of an unresponsive blank white screen, the React Error Boundary renders a clean fallback card: *"Something went wrong while rendering this view. Your data is safe in the cloud."* Action button: **"Reload Workspace"**. |
| **System Behaviour** | `componentDidCatch(error, errorInfo)` captures stack trace. Logs error to console. Prevents unmounting of entire DOM. |
| **Expected Result** | User can click "Reload Workspace" to restore application state. |
| **Error Handling** | Self-contained recovery container. |
| **Status** | **Implemented** |

---

### Scenario 7.8: Unsupported Device / Legacy Webview (Missing Modern JS APIs)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-07-08` |
| **Scenario Name** | Legacy Browser / Restricted Embedded Webview |
| **User Type** | User on Android 5.0 or legacy webview lacking `crypto.randomUUID` or modern ES6 features. |
| **User Action** | Opens app in legacy webview. |
| **Expected Screen** | If core APIs are missing, app displays compatibility notice: *"Your browser is running an outdated web engine. For optimal security and performance, please open in modern Google Chrome, Microsoft Edge, or Safari."*. |
| **System Behaviour** | Feature detection in entry point (`main.jsx`). UUID fallback polyfill generates pseudo-random timestamp hashes if `crypto.randomUUID` is unavailable. |
| **Expected Result** | Transparent user feedback rather than silent broken execution. |
| **Error Handling** | Fallback polyfills active. |
| **Status** | **Implemented** |
