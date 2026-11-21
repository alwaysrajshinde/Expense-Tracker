# 02. Registration and Login Scenarios

**Document Reference:** `UJ-DOC-02`  
**Classification:** Authentication & Identity Lifecycle Specification  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Security Engineers, Backend Architects, Frontend Developers, QA Testers  

---

## 1. Authentication Architecture & Identity Resolution

The application uses **Firebase Authentication** as its primary identity provider, supported by **Cloud Firestore** for user profile records and database authorization rules.

### 1.1 Identity Resolution Logic
To prevent duplicate account creation or fragmented user vaults:
1. Every authenticated user is assigned a permanent, immutable Firebase User ID (`uid`).
2. Cloud Firestore isolates all application records under `/users/{uid}/`.
3. If a user registers or logs in with Google OAuth using an email that matches an existing account, Firebase Auth links the identity or resolves it to the existing `uid`.
4. In `ensureUserProfile(uid, email, displayName)`:
   - If `/users/{uid}` exists: profile data, categories, and existing transactions are loaded without overwriting.
   - If `/users/{uid}` does not exist: the document is created and minimal starter categories are seeded.
5. High-volume existing accounts (specifically `raaajshinde@gmail.com`) are deterministically identified, linking to their preserved 1,216 transactions and 73 categories with a ₹12,000 monthly budget.

```
                  ┌──────────────────────────────────────────────┐
                  │          USER LOGIN OR REGISTRATION          │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                        ┌─────────────────────────────────┐
                        │ Firebase Auth: Resolve Identity │
                        └────────────────┬────────────────┘
                                         ▼
                             Does /users/{uid} exist?
                                  /            \
                           YES   /              \   NO
                                ▼                ▼
                  ┌──────────────────────┐  ┌──────────────────────────────┐
                  │ Load Existing Vault  │  │ New User Account Provisioning│
                  │ - Custom Categories  │  │ - Budget = ₹0 (Default)      │
                  │ - Monthly History    │  │ - 8 Minimal Starter Cats     │
                  │ - Target Budget      │  │ - Trigger 3-Step Tour        │
                  └──────────────────────┘  └──────────────────────────────┘
```

---

## 2. Authentication Scenarios Matrix

### Scenario 2.1: Returning User Login via Email & Password
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-01` |
| **Scenario Name** | Existing User Standard Email/Password Login |
| **User Type** | Existing / Returning User |
| **Preconditions** | User previously created account with email `alex@example.com` and password `password123`. |
| **User Action** | Opens app. In `Sign In` tab, enters `alex@example.com` and `password123`. Clicks `Sign In` button. |
| **Expected Screen** | Input fields disable, spinner displays on button. Stepwise overlay shows (1) Verifying credentials -> (2) Loading personal vault -> (3) Workspace ready. Dashboard renders within 1 second. |
| **System Behaviour** | Calls `signInWithEmailAndPassword(auth, email, password)`. Retrieves `uid`. Loads settings from `/users/{uid}`. Fetches month roll-up summary from `/users/{uid}/months/{currentMonth}`. |
| **Expected Result** | Successfully authenticated. Dashboard displays Alex's exact categories, recent expenses, and budget. |
| **Error Handling** | If password incorrect: displays inline red alert *"Incorrect password. Please try again or reset your password."* |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_universal_signin.png` |
| **Related Test** | `tests/e2e/01_authentication.spec.js` (Test A3) |

---

### Scenario 2.2: Existing Power User Login (`raaajshinde@gmail.com`)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-02` |
| **Scenario Name** | Power User Historical Vault Access |
| **User Type** | Existing Power User |
| **Preconditions** | User account `raaajshinde@gmail.com` with 1,216 historical transactions and 73 categories exists in Firestore vault. |
| **User Action** | Enters `raaajshinde@gmail.com` and valid password on `AuthGate`. |
| **Expected Screen** | Stepwise transition displays special badge: *"Synchronizing Raj's Historical Vault (1,216 records)..."*. Dashboard loads with ₹12,000 monthly budget, total expenses, and 73 category options in modals. |
| **System Behaviour** | Authenticates Firebase user. Verifies `/users/{uid}/transactions` has 1,216 records. Loads sub-5ms monthly summary. Skips onboarding tour. |
| **Expected Result** | 100% data integrity verified. No records altered. |
| **Error Handling** | Network retry logic protects large historical ledger queries. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_consumer_raj_dashboard.png` |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` (Test G1: Raj Shinde Vault Audit) |

---

### Scenario 2.3: Returning User Login via Google Account
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-03` |
| **Scenario Name** | Google One-Click Return Login |
| **User Type** | Returning User |
| **Preconditions** | User previously registered with Google OAuth. |
| **User Action** | Clicks `"Continue with Google"`. Selects their active Google account in the popup. |
| **Expected Screen** | Popup closes automatically. App transitions to Dashboard. |
| **System Behaviour** | `signInWithPopup` returns existing Google OAuth credential matching previously generated `uid`. Firestore document `/users/{uid}` is found immediately; no re-seeding occurs. |
| **Expected Result** | Direct login without additional prompts or data duplication. |
| **Error Handling** | If popup is blocked by browser: displays alert prompting user to allow popups for authentication. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 2.4: Cross-Device Login – Android PWA to Windows Desktop
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-04` |
| **Scenario Name** | Multi-Device Concurrent Session Initiation |
| **User Type** | Returning User (Cross-Device) |
| **Preconditions** | User is actively logged in on Android mobile. Now opens app on Windows desktop browser. |
| **User Action** | Opens desktop browser at application URL. Signs in with same email and password. |
| **Expected Screen** | Desktop adapts to Windows Workspace layout (collapsible sidebar, dual-panel analytics, top navigation with month picker). Data displayed matches mobile records exactly. |
| **System Behaviour** | Authenticates user against Firebase Auth. Reads same Firestore subcollections. Both devices hold valid ID tokens. |
| **Expected Result** | Seamless cross-platform access. Adding an expense on desktop syncs to mobile upon refresh. |
| **Error Handling** | If desktop network drops during sign-in, cached credentials or retry message appears. |
| **Status** | **Implemented** |
| **Screen Reference** | `Windows-light.png` / `mobile-light.png` |
| **Related Test** | `tests/e2e/08_ui_responsive.spec.js` |

---

### Scenario 2.5: Browser Refresh & Reopening Application (Session Persistence)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-05` |
| **Scenario Name** | Session Restoration on Page Reload / Reopen |
| **User Type** | Returning User |
| **Preconditions** | User is authenticated on Dashboard. |
| **User Action** | User presses F5 / Cmd+R to refresh the page, or closes the browser tab and re-opens the URL. |
| **Expected Screen** | Brief splash spinner (<200ms) with *"Connecting to your personal vault..."*, then immediate return to the active tab and selected month on Dashboard without showing the login gate. |
| **System Behaviour** | `localStorage.getItem('expense_tracker_auth_session')` is read synchronously during React hydration. `expires_at` is validated against `Date.now()`. Firebase Auth `onAuthStateChanged` confirms valid token in background. |
| **Expected Result** | User remains signed in. No re-login required. Active state preserved. |
| **Error Handling** | If session is expired (>30 days) or corrupted in localStorage, clears key and gracefully renders `AuthGate`. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` (Test A4) |

---

### Scenario 2.6: Expired Session & Automatic Token Refresh
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-06` |
| **Scenario Name** | 30-Day Session Expiration & Firebase Token Refresh |
| **User Type** | Returning User |
| **Preconditions** | User logged in 31 days ago, or session token was invalidated from Firebase Console. |
| **User Action** | Opens application after extended absence. |
| **Expected Screen** | Application detects expired session, clears local cached state, and presents `AuthGate` with informative toast: *"Your session has expired. Please sign in again."* |
| **System Behaviour** | `session.expires_at < Date.now()`. `localStorage.removeItem(STORAGE_KEY)`. User state reset to `null`. |
| **Expected Result** | Secure session termination protecting sensitive financial data on shared devices. |
| **Error Handling** | Prevents unauthenticated API calls from throwing raw 401 exceptions. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 2.7: User Cancels Google Authentication
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-07` |
| **Scenario Name** | User Aborts Google Sign-In Popup |
| **User Type** | Any User |
| **Preconditions** | User clicked "Continue with Google" and popup opened. |
| **User Action** | Clicks the "X" button on the Google popup window without choosing an account. |
| **Expected Screen** | Popup disappears. `AuthGate` returns to normal interactive state. No error dialog blocks the screen. |
| **System Behaviour** | Firebase throws error code `auth/popup-closed-by-user`. Caught by `catch` block in `loginWithGoogle()`. Submitting state reset to `false`. |
| **Expected Result** | Clean recovery. User can re-attempt Google login or choose email/password. |
| **Error Handling** | Silent non-disruptive handling of user cancellation. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 2.8: User Selects a Different Google Account
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-08` |
| **Scenario Name** | Google Account Switcher / Multi-Account Sign-In |
| **User Type** | Returning / Multi-Account User |
| **Preconditions** | User has multiple Google accounts logged into the browser (e.g. personal and work). |
| **User Action** | Clicks "Continue with Google". In the Google account picker, selects account B instead of account A. |
| **Expected Screen** | Application logs into account B's personal vault, displaying account B's distinct expenses, budget, and categories. |
| **System Behaviour** | Firebase Auth creates/resolves UID for account B. Reads `/users/{uid_B}`. Complete data isolation maintained. |
| **Expected Result** | Strict data isolation. No leakage between account A and account B. |
| **Error Handling** | If account B is disabled in Firebase, shows *"This account has been disabled."* |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` (Test G3: Cross-User Isolation) |

---

### Scenario 2.9: Password Reset Flow (Forgot Password)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-02-09` |
| **Scenario Name** | Password Recovery via Email Reset Link |
| **User Type** | Existing User |
| **Preconditions** | User forgot password for `alex@example.com`. |
| **User Action** | On `Sign In` tab, clicks *"Forgot password?"*. Enters `alex@example.com` in reset modal and clicks *"Send Reset Link"*. |
| **Expected Screen** | Input clears, success message displayed in modal: *"Password reset instructions sent to alex@example.com. Please check your inbox and spam folder."* |
| **System Behaviour** | Calls `sendPasswordResetEmail(auth, email)`. Firebase dispatches secure email containing time-limited password reset link. |
| **Expected Result** | User receives email, follows Google Firebase reset page, changes password, and successfully logs in. |
| **Error Handling** | If email not found in Firebase: gracefully states reset link was sent (standard security practice to prevent user enumeration). If email invalid format: shows *"Please enter a valid email address"*. |
| **Status** | **Implemented** |
| **Screen Reference** | `AuthGate.jsx` lines 147-160 |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

## 3. Security & Compliance Observations

1. **Password Minimum Length:** Currently enforced at 6 characters by Firebase default and client validation. Recommended enhancement: require at least 8 characters with alphanumeric combination.
2. **Account Enumeration Defense:** Password reset returns a generic success message, preventing attackers from checking if a specific email exists in the database.
3. **Session Revocation:** If an administrator disables a user in Firebase Auth Console, the token is revoked upon subsequent token refresh (within 60 minutes) or on next login.
