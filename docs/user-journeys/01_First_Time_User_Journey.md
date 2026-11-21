# 01. First-Time User Journey & Onboarding Architecture

**Document Reference:** `UJ-DOC-01`  
**Classification:** User Experience Specification & Product Architecture  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Product Managers, UX Designers, Frontend Engineers, QA Automation Engineers  

---

## 1. Executive Overview

This document specifies the complete end-to-end journey experienced by a completely new user arriving at the **Expense Tracker** application for the first time. It covers every screen, interaction, visual feedback state, background cloud transaction, edge case, and exception from the initial URL navigation to landing on an active, personalized dashboard.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NEW USER ONBOARDING FUNNEL ARCHITECTURE                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 [1. First Launch] ──► [2. AuthGate UI] ──► [3. Registration / OAuth] ──► [4. Account Provisioning]
         │                    │                         │                         │
  PWA / Browser        Toggle Sign Up           Email+Password / Google     Firestore /users/{uid}
  Service Worker       Modern Purple Card       Auth Handshake              8 Minimal Categories
         ▼                    ▼                         ▼                         ▼
 [8. Active Home] ◄── [7. Target Budget] ◄── [6. Interactive Tour] ◄── [5. Profile & Vault Init]
  Empty Dashboard     User Sets Budget       3-Step Modal Guidance       Budget Default: ₹0
  Quick Log CTA       (Default: ₹0)          localStorage Tour Key       Roll-up Cache Seed
```

---

## 2. Visual & Architectural Breakdown

### 2.1 Screen State 1: Application Boot & Splash
When a user navigates to the application root (`/` or `http://localhost:3001` or production domain), the following occurs:
1. **Asset Loading:** HTML5 shell and Vite React bundle load. If registered as a PWA, Service Worker (`sw.js`) checks cache storage.
2. **Session Verification:** `AuthContext.jsx` initiates an asynchronous check against `firebase.auth().onAuthStateChanged` and examines `localStorage.getItem('expense_tracker_auth_session')`.
3. **Loading State Presentation:** While `isLoading === true`, the screen displays a centered modern splash indicator:
   - **Background:** `#f4f5fa` (Light Mode) or `#0d0b18` (Dark Mode).
   - **Spinner:** 40px diameter CSS spinner with 3px border in purple (`#6C47FF`) with a transparent top border animating continuously at 1 rotation per second.
   - **Copy:** `"Connecting to your personal vault..."` rendered in 12px semi-bold slate text.

### 2.2 Screen State 2: The Universal Authentication Gate (`AuthGate.jsx`)
If no active session is discovered, `AuthGate.jsx` takes over the entire viewport.
- **Visual Design:** Centered high-elevation card (max width 440px) with smooth backdrop gradient (`from-purple-50 via-white to-indigo-50` in light mode, `#0d0b18` in dark mode).
- **Brand Identity:**
  - Header icon: Rounded 16px square icon in deep purple gradient featuring a crisp white `Wallet` SVG glyph.
  - Title: **"Expense Tracker"** (24px bold typography).
  - Subtitle: *"Smart personal expense management with cloud sync & automated Google Sheets ledger"* (13px neutral slate).
- **Tab Switcher:** Pill-shaped segmented control with two tabs:
  1. `Sign In` (Returning users)
  2. `Create Account` (New user focus)
- **Primary Registration Actions:**
  - **"Continue with Google" Button:** White background with 1px border, prominent Google multicolored SVG "G" logo, hover elevation, and full-width layout.
  - **Divider:** Elegant horizontal separator with centered text: *"or continue with email"*.
  - **Email Registration Form:**
    - `Full Name`: Text input with `User` icon prefix, placeholder *"e.g. Alice Johnson"*.
    - `Email Address`: Email input with `Mail` icon prefix, placeholder *"you@example.com"*.
    - `Password`: Secure password input with `Lock` prefix and eye toggle button (`Eye` / `EyeOff`), placeholder *"Min. 6 characters"*.
    - `Confirm Password`: Password confirmation input with matching validation.
    - `Create Account` Button: Gradient button (`from-purple-600 to-indigo-600`), high-contrast white text, hover lift animation.
- **Footer Trust Indicators:** Displays three trust chips:
  - `Secure Cloud Sync` (ShieldCheck icon)
  - `Private Google Sheet` (FileSpreadsheet icon)
  - `Zero Ad Tracking` (Database icon)
- **Terms & Privacy:** Subtext linking to Terms of Service and Privacy Policy (`#terms`, `#privacy`).

### 2.3 Screen State 3: Stepwise Registration Handshake Animation
Upon submitting valid registration credentials, the form inputs are disabled, and a dynamic 3-phase transition animation modal overlay is presented:
1. **Phase 1 (`auth`):** *"Creating your secure account..."* (Spinner active).
2. **Phase 2 (`sync`):** *"Provisioning personal database vault..."* (Checkmark pulse).
3. **Phase 3 (`ready`):** *"Vault ready! Launching workspace..."* (Green badge confirmation).

### 2.4 Screen State 4: First-Run Personal Database Initialization (`firestoreService.js`)
Behind the scenes, `ensureUserProfile(userId, email, displayName)` executes:
1. **Firestore User Document (`/users/{uid}`):**
   ```json
   {
     "email": "alice@example.com",
     "displayName": "Alice Johnson",
     "monthly_budget": 0,
     "currency": "₹",
     "migrated": false,
     "onboarding_completed": false,
     "spreadsheet_id": null,
     "spreadsheet_url": null,
     "created_at": "2026-11-21T13:30:00.000Z"
   }
   ```
2. **Starter Categories Seeding (`/users/{uid}/categories/{catId}`):**  
   To prevent cognitive overload, the system seeds exactly **8 minimal starter categories** (rather than Raj's 73 granular sub-categories):
   - `Food & Dining` (Icon: Utensils, Color: `#6C47FF`, Quick: true)
   - `Groceries` (Icon: ShoppingBag, Color: `#10B981`, Quick: true)
   - `Transportation` (Icon: Car, Color: `#F59E0B`, Quick: true)
   - `Shopping` (Icon: Shirt, Color: `#EC4899`, Quick: true)
   - `Bills & Utilities` (Icon: Zap, Color: `#3B82F6`, Quick: false)
   - `Entertainment` (Icon: Film, Color: `#8B5CF6`, Quick: false)
   - `Health` (Icon: HeartPulse, Color: `#EF4444`, Quick: false)
   - `Other` (Icon: Tag, Color: `#64748B`, Quick: false)
3. **Target Budget Policy:** Initialized to **₹0** by default, requiring intentional budget entry rather than assuming a legacy target like ₹12,000.

### 2.5 Screen State 5: Interactive 3-Step Onboarding Tour (`OnboardingTourModal.jsx`)
Immediately upon landing on the Dashboard, if `onboarding_completed === false` and `localStorage.getItem('et_tour_completed_{uid}') !== 'true'`, the 3-step tour modal appears with a soft backdrop blur:
- **Slide 1: Welcome & Monthly Budget Target:**
  - Illustration: Gradient purple target with financial coin graphic.
  - Title: *"Welcome to Expense Tracker!"*
  - Body: *"Take full control of your cash flow. Your monthly budget starts at ₹0 so you can tailor your goals accurately. You can customize your budget anytime from Settings."*
  - Action: **"Next: Quick Logging"** (or top-right *"Skip"* link).
- **Slide 2: Rapid Expense Logging:**
  - Illustration: Lightning bolt receipt icon.
  - Title: *"Log Expenses in Under 3 Seconds"*
  - Body: *"Tap the '+' button anytime. Use 'Save & Add Another' when entering multiple receipts from grocery runs or dining out to save time."*
  - Action: **"Next: Reports & Data"**.
- **Slide 3: Visual Analytics & Complete Data Ownership:**
  - Illustration: Donut chart with Excel download sheet icon.
  - Title: *"Instant Insights & Sovereign Ownership"*
  - Body: *"View spending by category, track daily trends, and export your entire financial history to Excel or Google Sheets anytime. Your data belongs exclusively to you."*
  - Action: **"Get Started Now!"** (Closes modal, persists completion flag to `localStorage` and marks `onboarding_completed: true` in Firestore).

---

## 3. Detailed Scenario Specifications

### Scenario 1.1: First-Time Application Visit & Welcome Screen Render
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-01-01` |
| **Scenario Name** | Cold Launch by Unauthenticated Visitor |
| **User Type** | New User |
| **Preconditions** | User opens modern browser (Chrome/Edge/Safari/Firefox), clears cookies/storage, visits app root URL. |
| **User Action** | Navigates to application domain. |
| **Expected Screen** | Brief display of *"Connecting to your personal vault..."* spinner (<500ms), followed by high-elevation Universal `AuthGate` centered modal on modern purple fintech backdrop. |
| **System Behaviour** | Checks Firebase Auth state; detects `null`. Checks `localStorage`; finds no session. Sets `isLoading: false`. |
| **Expected Result** | Clean login/registration gate displayed with "Sign In" active by default and "Create Account" tab visible. |
| **Error Handling** | If internet is offline, displays offline alert card with option to retry connection. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_universal_signin.png` |
| **Related Test** | `tests/e2e/01_authentication.spec.js` (Test A1: Universal AuthGate Presence) |

---

### Scenario 1.2: New User Registration via Email and Password
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-01-02` |
| **Scenario Name** | Direct Account Creation via Email / Password |
| **User Type** | New User |
| **Preconditions** | User is on `AuthGate` screen. User email has never been registered in Firebase Auth. |
| **User Action** | Clicks `Create Account` tab. Enters Name ("Alice"), Email ("alice@example.com"), Password ("secret123"), Confirm Password ("secret123"). Clicks `Create Account` button. |
| **Expected Screen** | Button transitions to spinner. Stepwise transition overlay appears: (1) Creating secure account -> (2) Provisioning personal database vault -> (3) Vault ready! Dashboard loads with 3-step Onboarding Tour. |
| **System Behaviour** | Calls `createUserWithEmailAndPassword(auth, email, password)`. Sets display name. Calls `ensureUserProfile(uid, email, "Alice")`. Creates `/users/{uid}` in Firestore with `monthly_budget: 0`. Seeds 8 minimal categories into `/users/{uid}/categories`. |
| **Expected Result** | Account created. User logged in. User lands on Dashboard with Onboarding Tour Modal active. |
| **Error Handling** | If password < 6 characters: displays red inline alert *"Password must be at least 6 characters long"*. If passwords do not match: displays *"Passwords do not match"*. If email already registered: auto-detects and attempts authentication or shows friendly notice. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_universal_signup.png` |
| **Related Test** | `tests/e2e/01_authentication.spec.js` (Test A2: New User Registration) |

---

### Scenario 1.3: New User Registration via Google OAuth (and Google Unverified Warning)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-01-03` |
| **Scenario Name** | Registration via "Continue with Google" |
| **User Type** | New User |
| **Preconditions** | User is on `AuthGate`. Google OAuth provider is configured in Firebase. |
| **User Action** | Clicks `"Continue with Google"` button. |
| **Expected Screen** | Browser opens Google OAuth consent popup (`accounts.google.com`). |
| **System Behaviour** | Executes `signInWithPopup(auth, googleProvider)`. Requests Google Sheets/Drive scopes if configured. Receives OAuth credential and access token. |
| **Expected Result** | If project is in development mode, Google presents the standard OAuth consent screen. If Google displays *"Google hasn't verified this app"*, user clicks *"Advanced"* -> *"Go to Expense Tracker (unsafe)"* to proceed. App receives token, calls `ensureUserProfile`, creates personal Google Sheet in user's Drive, and launches Dashboard. |
| **Error Handling** | If user closes the popup without selecting an account: `auth/popup-closed-by-user` is caught gracefully; UI resets to normal state without crashing or displaying raw stack traces. |
| **Status** | **Implemented** |
| **Screen Reference** | User uploaded screenshot `media_1795240070209_12fa321a.png` (Google unverified app warning) |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 1.4: First-Run Onboarding Tour Presentation & Budget Setup
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-01-04` |
| **Scenario Name** | First-Run Onboarding Tour & Initial Budget Zero Callout |
| **User Type** | New User |
| **Preconditions** | User has registered and arrived at Dashboard for the very first time (`onboarding_completed === false`). |
| **User Action** | Views Step 1 (Welcome & Budget). Clicks *"Next: Quick Logging"*. Views Step 2. Clicks *"Next: Reports & Data"*. Views Step 3. Clicks *"Get Started Now!"*. On Dashboard Hero Card, notices *"No budget set"* badge and amber *"Set Monthly Budget"* CTA. Clicks *"Set Monthly Budget"*. Enters ₹8,000 and clicks Save. |
| **Expected Screen** | Onboarding modal steps through 3 slides with progress dots. Closing modal reveals Dashboard with ₹0 spent, "No budget set" badge, and 0 transactions. Clicking "Set Monthly Budget" navigates to Settings > Budget tab. Saving ₹8,000 shows green toast *"Monthly budget updated!"* and returns to Dashboard showing *"Monthly Budget: ₹8,000"*, *"Remaining: ₹8,000"*. |
| **System Behaviour** | Modal sets `localStorage.setItem('et_tour_completed_' + uid, 'true')`. Settings page updates Firestore `/users/{uid}` field `monthly_budget: 8000`. Recalculates month roll-up cache. |
| **Expected Result** | User completes onboarding and establishes their first personal budget without confusion. |
| **Error Handling** | If user dismisses tour via "Skip", tour immediately closes and does not re-open on page refresh. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_consumer_alex_empty.png` |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` (Test B1: New Consumer Dashboard Validation) |

---

### Scenario 1.5: User Closes Browser / Aborts During Registration
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-01-05` |
| **Scenario Name** | Mid-Registration Browser Termination |
| **User Type** | New User |
| **Preconditions** | User is halfway through entering fields or closes browser during Google OAuth popup. |
| **User Action** | Closes browser tab or loses power. |
| **Expected Screen** | No partial corrupted records. Upon reopening, user lands back on `AuthGate`. |
| **System Behaviour** | If Firebase user was not created, no database space is allocated. If Firebase user was created but browser closed before Firestore init, the `onAuthStateChanged` hook on next visit automatically triggers `ensureUserProfile(uid, email)` to heal and complete the setup. |
| **Expected Result** | Self-healing architecture prevents orphaned or half-initialized accounts. |
| **Error Handling** | Silent recovery via idempotent `ensureUserProfile` execution. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` |

---

## 4. Missing UI States & Recommended Improvements for First-Time Users

1. **Inline Target Budget Input in Tour Slide 1 (Recommended UX Enhancement):**
   - *Current State:* Tour Slide 1 tells the user their budget starts at ₹0 and directs them to Settings.
   - *Improvement Opportunity:* Allow the user to type their target budget (e.g. `[ ₹ 10,000 ]`) directly inside Slide 1 before clicking "Next". If left blank, it defaults to ₹0. This eliminates the extra navigation to Settings.
2. **Google App Verification Guidance Note:**
   - *Current State:* Users encounter the unverified developer screen on Google OAuth.
   - *Improvement Opportunity:* Add an informational tooltip or badge beside "Continue with Google" stating: *"In development mode: click 'Advanced' > 'Proceed to Expense Tracker' if prompted by Google"*.
3. **Starter Category Customizer on Onboarding:**
   - *Current State:* 8 default categories are auto-seeded.
   - *Improvement Opportunity:* Allow new users to toggle on/off categories (e.g. uncheck "Car / Transportation" if they don't own a vehicle) during first-run setup.
