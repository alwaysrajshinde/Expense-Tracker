# 04. Account and Settings Scenarios

**Document Reference:** `UJ-DOC-04`  
**Classification:** User Account, Taxonomy & System Settings Specification  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Product Managers, Security Architects, Frontend Engineers, QA Engineers  

---

## 1. Overview of Account & Settings Architecture

The Settings module (`Settings.jsx`) serves as the administrative hub for personal configuration, financial constraints, custom category taxonomies, and account security. It is organized into 5 intuitive tabs:
1. **Budget & Financial Targets:** Monthly budget threshold, currency format, and pacing alerts.
2. **Category Taxonomy:** Category creation, icon/color customization, and quick-access toggling.
3. **Data Management:** Unencrypted Excel `.xlsx` export, JSON ledger backup, JSON restore, and Google Sheets integration.
4. **Profile & Preferences:** Display name, email address, and theme mode (Light / Dark).
5. **Security & Session:** Password change triggers, sign-out, and permanent account deletion.

---

## 2. Detailed Scenario Specifications

### Scenario 4.1: Viewing Account Profile & Sync Status
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-01` |
| **Scenario Name** | View Account Details and Cloud Vault Health |
| **User Type** | Any User |
| **Preconditions** | User is authenticated. |
| **User Action** | Navigates to Settings > Profile tab. |
| **Expected Screen** | Displays User Avatar/Initials badge, Display Name input, Email Address (read-only with verified check), Account Role (`Personal Vault`), Linked Google Sheet status with link if active, and Theme toggle. |
| **System Behaviour** | Reads profile fields from Firestore `/users/{uid}` and active Firebase Auth `currentUser` object. |
| **Expected Result** | Transparent visibility into account identity and cloud synchronization status. |
| **Error Handling** | If user profile fails to load from Firestore, displays values from local auth token fallback. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` |

---

### Scenario 4.2: Modifying Monthly Target Budget
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-02` |
| **Scenario Name** | Update Monthly Target Budget |
| **User Type** | Any User |
| **Preconditions** | User wants to increase budget from ₹8,000 to ₹15,000. |
| **User Action** | Opens Settings > Budget tab. Replaces `8000` with `15000` in the `Monthly Budget` field. Clicks `Save Changes`. |
| **Expected Screen** | Button displays brief saving spinner. Green toast appears: *"Settings updated successfully!"*. Navigating to Dashboard immediately shows `Monthly Budget: ₹15,000` and recalculated remaining balance. |
| **System Behaviour** | Calls `api.updateSettings({ monthly_budget: 15000 })`. Updates Firestore `/users/{uid}.monthly_budget`. Updates current month roll-up document `/users/{uid}/months/{monthKey}.budget` to ensure consistency. |
| **Expected Result** | Target budget updated across all screens without page reload. |
| **Error Handling** | If user enters negative budget or non-numeric characters, validation alert prevents submission. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` (Test B1) |

---

### Scenario 4.3: Changing Currency Symbol
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-03` |
| **Scenario Name** | Currency Localization (₹, $, €, £) |
| **User Type** | International / Expatriate User |
| **Preconditions** | User relocates or manages expenses in US Dollars ($). |
| **User Action** | In Settings > Budget tab, selects `$` from the currency dropdown and clicks Save. |
| **Expected Screen** | Green toast appears. All financial displays throughout the app (Hero Card, Stat Cards, Ledger rows, Reports charts) update instantly from `₹` to `$`. |
| **System Behaviour** | Updates `currency: "$"` in `/users/{uid}` and updates `formatCurrency` helper in React context. |
| **Expected Result** | Complete currency localization across desktop and mobile views. |
| **Error Handling** | Falls back to default `₹` (INR) if value is undefined. |
| **Status** | **Implemented** |

---

### Scenario 4.4: Adding a Custom Category
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-04` |
| **Scenario Name** | Custom Category Creation |
| **User Type** | Any User |
| **Preconditions** | User wants to track a specific niche expense: `Gym & Fitness`. |
| **User Action** | Navigates to Settings > Categories tab. Clicks `+ Add Category`. Enters Name: `Gym & Fitness`. Selects `Dumbbell` icon. Chooses `#10B981` (Emerald). Toggles `Show in Quick Categories`. Clicks `Save Category`. |
| **Expected Screen** | New category card appears in the category grid with its selected icon and color. Green toast appears. Opening `Add Expense` modal immediately displays `Gym & Fitness` as one of the top quick-select chips. |
| **System Behaviour** | Writes new document to `/users/{uid}/categories`. Adds category to local memory cache. |
| **Expected Result** | Personalized expense taxonomy expanded seamlessly. |
| **Error Handling** | If category name is empty or already exists, shows warning: *"Category name cannot be empty or duplicate"*. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/04_categories.spec.js` (Test D1) |

---

### Scenario 4.5: Deleting a Category
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-05` |
| **Scenario Name** | Category Deletion & Historical Integrity |
| **User Type** | Any User |
| **Preconditions** | User wants to delete an obsolete category `Office Tifin`. Existing transactions may reference this category. |
| **User Action** | In Settings > Categories, clicks `Delete` on `Office Tifin`. Confirmation modal warns: *"Existing transactions with this category will remain preserved with their category label. Continue?"*. User clicks `Confirm Delete`. |
| **Expected Screen** | Category disappears from active selection dropdowns. Toast: *"Category removed"*. Historical transactions in Transactions ledger continue displaying `Office Tifin` text with neutral icon. |
| **System Behaviour** | Deletes `/users/{uid}/categories/{catId}`. Does NOT execute destructive batch updates on past transactions. |
| **Expected Result** | Historical audit trail remains 100% intact while decluttering future expense logging. |
| **Error Handling** | Built-in fallback icon renders if a historical transaction references a deleted category ID. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/04_categories.spec.js` (Test D2) |

---

### Scenario 4.6: User Sign-Out / Session Termination
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-06` |
| **Scenario Name** | Graceful Account Logout |
| **User Type** | Any Authenticated User |
| **Preconditions** | User is on Settings or clicks avatar icon in header. |
| **User Action** | Clicks `Sign Out` button. Confirms logout prompt. |
| **Expected Screen** | Screen immediately transitions back to `AuthGate` login screen. Form fields are reset and empty. |
| **System Behaviour** | Executes `signOut(auth)`. Clears `localStorage.removeItem('expense_tracker_auth_session')`. Resets React user state to `null`. Wipes in-memory transaction and reports caches. |
| **Expected Result** | Clean session termination. Subsequent back-button navigation in browser does not expose cached personal financial data. |
| **Error Handling** | If network drops during logout, local session is wiped regardless, ensuring device security. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/01_authentication.spec.js` (Test A5) |

---

### Scenario 4.7: Permanent Account Deletion
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-04-07` |
| **Scenario Name** | GDPR / Privacy Right-to-be-Forgotten Permanent Account Deletion |
| **User Type** | Any User |
| **Preconditions** | User wants to permanently purge their account and all financial records. |
| **User Action** | Navigates to Settings > Security. Enters confirmation phrase `"DELETE MY DATA"` and clicks `Permanently Delete Account`. |
| **Expected Screen** | Progress overlay shows: *"Purging transaction records... Deleting category taxonomy... Removing profile..."*. User is returned to `AuthGate` with confirmation toast: *"Your account and data have been permanently deleted."* |
| **System Behaviour** | Executes batch delete across `/users/{uid}/transactions`, `/users/{uid}/categories`, `/users/{uid}/months`, and deletes document `/users/{uid}`. Calls `firebase.auth().currentUser.delete()`. Clears all local storage. |
| **Expected Result** | Complete data eradication complying with international privacy regulations. |
| **Error Handling** | If user has recently re-authenticated, deletion succeeds. If session requires recent login, prompts user to sign in again before proceeding (standard Firebase security requirement `auth/requires-recent-login`). |
| **Status** | **Requires Verification / Proposed Backend Enhancement** |

---

## 3. Unclear Business Rules & Governance Decisions

1. **Category Deletion Cascade Rule:**  
   *Current Implementation:* Deleting a category removes it from the user's category picker, but leaves historical transactions unchanged.  
   *Alternative Option:* Prompt user to reassign historical transactions to another category (e.g. `Other`).  
   *Recommendation:* Maintain current behavior, but offer an optional *"Reassign past transactions to [Category]"* dropdown during deletion.
2. **Multi-Device Remote Sign-Out:**  
   *Current Implementation:* Sign-out is local to the current browser/device.  
   *Proposed Enhancement:* Firebase Auth supports revoking all refresh tokens for a user via Firebase Admin SDK. Implementing an endpoint `/api/auth/revoke-sessions` would allow users to terminate sessions on lost or stolen mobile devices from their desktop.
