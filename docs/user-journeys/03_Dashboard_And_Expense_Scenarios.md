# 03. Dashboard and Expense Scenarios

**Document Reference:** `UJ-DOC-03`  
**Classification:** Core Functional Specification & Financial Calculations  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Product Managers, Financial Analysts, Frontend Engineers, QA Automation Testers  

---

## 1. Dashboard Architecture & Visual Design

The Expense Tracker dashboard serves as the central command cockpit for personal cash flow visibility. Built to match the modern purple fintech design standard, it adapts seamlessly between mobile cards and desktop multi-panel workspaces.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DASHBOARD INFORMATION HIERARCHY                          │
├──────────────────────────────────────────────────────────┬─────────────────────────────┤
│ 1. HERO PURPLE CARD                                      │ 2. CIRCULAR GAUGE           │
│    - Target Monthly Budget (or "Set Budget" CTA)         │    - Real-time % spent      │
│    - Month Total Spent (Huge bold typography)            │    - Dynamic SVG arc        │
│    - Remaining Balance Badge ("Remaining" / "Over by")   │                             │
├──────────────────────────────────────────────────────────┴─────────────────────────────┤
│ 3. QUICK STAT CARDS (3-COLUMN GRID)                                                    │
│    [ Today's Spend ]        [ This Week's Spend ]         [ Top Spending Category ]    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. RECENT ACTIVITY CARD / LEDGER PREVIEW                                               │
│    - Last 5 transactions with Category Icon, Description, Date, Payment Mode, Amount  │
│    - One-click "View All" link to Transactions Ledger                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dashboard State Scenarios

### Scenario 3.1: New User with Zero Transactions (Empty State)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-01` |
| **Scenario Name** | Zero-Transaction Empty State Dashboard |
| **User Type** | New User |
| **Preconditions** | User just completed registration; no expenses have been recorded yet. |
| **User Action** | Views Dashboard. |
| **Expected Screen** | Hero Purple Card displays `Monthly Budget: No budget set` (with amber `Set Monthly Budget` link), `Spent: ₹0`, and `Remaining: No budget set`. Gauge shows `0%`. Quick stats show `Today: ₹0`, `Week: ₹0`, `Top Category: -`. Recent activity shows clean empty state illustration with text: *"No expenses logged this month yet. Tap + to add your first expense!"* |
| **System Behaviour** | Fetches `/users/{uid}/months/{currentMonth}`. Returns default zero roll-up object. No Firestore query errors. |
| **Expected Result** | Clean, welcoming empty state encouraging the user to set a budget or log an expense without error dialogs. |
| **Error Handling** | If API request fails, retries automatically with local zero fallback. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_consumer_alex_empty.png` |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` (Test B1) |

---

### Scenario 3.2: User with Regular Expenses within Target Budget
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-02` |
| **Scenario Name** | Normal Spending Under Target Budget |
| **User Type** | Active User |
| **Preconditions** | User monthly budget = ₹10,000. Total expenses logged this month = ₹4,250 across 12 transactions. |
| **User Action** | Opens Dashboard. |
| **Expected Screen** | Hero Card: `Budget: ₹10,000`, `Spent: ₹4,250`. Remaining badge is styled in bright emerald green: `Remaining: ₹5,750`. Circular SVG gauge indicates `42.5%`. Quick stats display accurate daily and weekly aggregates. Recent transactions list latest 5 expenses with colored category badges. |
| **System Behaviour** | Computes $\text{Remaining} = 10,000 - 4,250 = 5,750$. Evaluates $\text{Remaining} \ge 0$, applying green badge styling. Gauge renders dashoffset for 42.5%. |
| **Expected Result** | Positive financial reinforcement; clear awareness that ₹5,750 remains available. |
| **Error Handling** | None needed; ideal operating condition. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` (Test B2) |

---

### Scenario 3.3: User Exceeding the Monthly Budget (Over-Budget Alert)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-03` |
| **Scenario Name** | Budget Overrun / Negative Remaining Balance |
| **User Type** | Active User |
| **Preconditions** | User monthly budget = ₹12,000. Total expenses logged = ₹13,995. |
| **User Action** | Opens Dashboard. |
| **Expected Screen** | Hero Card displays `Budget: ₹12,000`, `Spent: ₹13,995`. Remaining badge automatically switches to high-contrast rose/red: `Remaining: Over by ₹1,995`. Circular progress gauge fills to `100%` and displays `116.6%`. |
| **System Behaviour** | Computes $\text{Remaining} = 12,000 - 13,995 = -1,995$. Detects negative value; formats string as `Over by ₹1,995` and sets CSS class to `bg-rose-100 text-rose-950`. |
| **Expected Result** | Immediate, unambiguous visual warning alerting user that their target budget has been breached by ₹1,995. |
| **Error Handling** | Does not block further expense entries; system continues tracking ledger accurately. |
| **Status** | **Implemented** |
| **Screen Reference** | `screenshot_consumer_raj_dashboard.png` |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` (Test B3) |

---

### Scenario 3.4: Handling Refunds and Credit Transactions
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-04` |
| **Scenario Name** | Expense Refund / Credit Return |
| **User Type** | Active User |
| **Preconditions** | User returned a defective product and received a ₹1,200 UPI refund. |
| **User Action** | Opens `Add Expense`, enters Amount `₹1,200`, toggles `Refund / Credit` switch (or selects refund option), chooses Category `Shopping`, clicks Save. |
| **Expected Screen** | Green toast appears: *"Refund transaction recorded!"*. Dashboard Total Spent decreases by ₹1,200. Remaining budget increases by ₹1,200. In recent transactions, the entry appears with a green `+₹1,200` badge and `RotateCcw` refund icon. |
| **System Behaviour** | Sets `is_refund: true` and stores amount as `-1200` or nets it against category total. Recalculates month roll-up cache. |
| **Expected Result** | Cash flow net balance is mathematically accurate without artificially inflating total monthly expenditure. |
| **Error Handling** | If user attempts to enter negative sign `-` manually in amount field, input filter strips it and enforces the `Refund` toggle. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` |

---

### Scenario 3.5: User Opening Application in a New Month
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-05` |
| **Scenario Name** | First Launch in a New Calendar Month (e.g. Dec 1) |
| **User Type** | Returning User |
| **Preconditions** | User was active in November. Today is December 1st. |
| **User Action** | Launches application. |
| **Expected Screen** | Selected month selector defaults to current month (`December 2026`). Dashboard resets to `Spent: ₹0`, `Remaining: ₹Budget`. Historical months remain selectable in dropdown (`November 2026`, `October 2026`). |
| **System Behaviour** | `getLocalMonthKey()` dynamically derives `2026-12`. User target budget is carried forward from `/users/{uid}.monthly_budget`. A new month roll-up summary is initialized in Firestore upon the first December expense. |
| **Expected Result** | Zero manual rollover effort required. Monthly budget target carries over automatically. |
| **Error Handling** | If month selector is toggled to a historical month with zero data, displays empty state for that month without affecting current data. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/02_dashboard.spec.js` |

---

### Scenario 3.6: High-Volume Ledger Performance (1,216 Historical Records)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-06` |
| **Scenario Name** | Power User Sub-5ms Dashboard Cache Resolution |
| **User Type** | Power User (`Raj Shinde`) |
| **Preconditions** | User account has 1,216 historical transactions spanning multiple years. |
| **User Action** | Logs in and switches between historical months. |
| **Expected Screen** | Dashboard renders instantaneous aggregates (<100ms UI update). No lag, UI freeze, or page stuttering. |
| **System Behaviour** | Dashboard loads pre-aggregated document from `/users/{uid}/months/{monthKey}` rather than streaming and summing 1,216 individual records in client memory. |
| **Expected Result** | Enterprise-grade query efficiency; avoids thousands of billable Firestore reads on every visit. |
| **Error Handling** | If roll-up cache is missing, backend/client falls back to calculating sum from raw transactions and creates the cache document. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` |

---

## 3. Daily Expense Entry Scenarios

### Scenario 3.7: Standard Single Expense Entry
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-07` |
| **Scenario Name** | Single Expense Entry via Modal |
| **User Type** | Any User |
| **Preconditions** | User is on Dashboard or Transactions page. |
| **User Action** | Clicks `+ Add Expense` button. Enters Amount `₹250`. Selects `Food & Dining`. Selects `UPI`. Enters Description `Team coffee`. Date defaults to today. Clicks `Save Expense`. |
| **Expected Screen** | Modal closes smoothly. Green toast appears: *"Expense added successfully!"*. Hero Card `Spent` increments by ₹250. New transaction appears at the top of recent transactions list. |
| **System Behaviour** | Writes new document to `/users/{uid}/transactions`. Atomically updates `/users/{uid}/months/{monthKey}` total spent, category spending, and payment mode totals. |
| **Expected Result** | Seamless logging cycle completed in under 3 seconds. |
| **Error Handling** | If Firestore write fails, shows red toast alert and leaves modal data intact so user doesn't lose their input. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` (Test C1) |

---

### Scenario 3.8: Rapid Multi-Expense Logging ("Save & Add Another")
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-08` |
| **Scenario Name** | Batch Receipt Entry via Sticky Form State |
| **User Type** | Any User (Power Entry) |
| **Preconditions** | User has a stack of 4 receipts from a shopping trip. |
| **User Action** | Clicks `+ Add Expense`. Enters Amount `₹150`, Category `Groceries`, Payment `UPI`, Date `2026-11-21`. Clicks **"Save & Add Another"**. |
| **Expected Screen** | Modal remains open. Amount and Description clear. Date (`2026-11-21`) and Payment Mode (`UPI`) stay sticky. Green inline badge flashes *"✓ Saved! Ready for next expense"*. User logs next 3 receipts consecutively without reopening modal. |
| **System Behaviour** | Writes transaction to Firestore; updates roll-up cache. Triggers `onSaveAnotherSuccess()`. Resets only transient input fields. |
| **Expected Result** | Cuts multi-receipt entry time by over 60%, eliminating repetitive modal open/close animations. |
| **Error Handling** | If one submission fails, it stays on that specific receipt with error message; previously saved receipts remain committed. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` (Test C2) |

---

### Scenario 3.9: Desktop Inline Quick Add Expense Form
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-09` |
| **Scenario Name** | Desktop Productivity Inline Entry |
| **User Type** | Windows Desktop User |
| **Preconditions** | User viewing Dashboard on desktop viewport ($\ge 1024\text{px}$). |
| **User Action** | Uses the horizontal inline form positioned directly beneath the Stat Cards: types `₹450`, selects category from compact dropdown, types `Dinner`, presses `Enter`. |
| **Expected Screen** | Form displays brief green checkmark. Green toast appears. Ledger updates immediately without any modal dialog opening. |
| **System Behaviour** | Executes `onQuickAddExpense`. Updates Firestore document and roll-up cache. Form resets focus back to Amount input for rapid continuous typing. |
| **Expected Result** | Maximum desktop efficiency; keyboard-driven entry for office and workstation environments. |
| **Error Handling** | If amount is empty, shows non-blocking warning toast: *"Please enter a valid amount"*. |
| **Status** | **Implemented** |
| **Screen Reference** | `Home.jsx` lines 84-111 |
| **Related Test** | `tests/e2e/08_ui_responsive.spec.js` |

---

### Scenario 3.10: Form Validation – Missing, Zero, or Negative Amount
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-10` |
| **Scenario Name** | Amount Input Boundary Validation |
| **User Type** | Any User |
| **Preconditions** | `Add Expense` modal is open. |
| **User Action** | Case A: Leaves amount empty and clicks Save. Case B: Enters `0` and clicks Save. Case C: Enters `abc` and clicks Save. |
| **Expected Screen** | Modal does not close. Red alert banner appears above form: *"Please enter a valid positive amount"*. Amount input is bordered in red. |
| **System Behaviour** | Client-side validation block in `handleSubmit`: checks `!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0`. Halts execution before database dispatch. |
| **Expected Result** | Prevents corrupted or meaningless zero/text transactions in the ledger. |
| **Error Handling** | Clean client-side rejection with zero network overhead. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` (Test C3) |

---

### Scenario 3.11: Form Validation – Decimal / Fractional Currency (Paisa)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-11` |
| **Scenario Name** | Fractional Currency Entry (e.g. ₹99.50) |
| **User Type** | Any User |
| **Preconditions** | `Add Expense` modal is open. |
| **User Action** | Enters `99.50` in Amount. Selects category and clicks Save. |
| **Expected Screen** | Expense saved successfully. App renders amount formatted as `₹99.50` in ledger and updates dashboard total spending. |
| **System Behaviour** | Parses amount with `parseFloat(amount)`. Preserves standard two-decimal precision. |
| **Expected Result** | Accurate representation of exact bill totals (e.g. utility bills or fuel totals). |
| **Error Handling** | If user types more than two decimal points (e.g. `99.50.2`), input sanitization catches `isNaN` and prompts correction. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` |

---

### Scenario 3.12: Editing an Existing Expense Transaction
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-12` |
| **Scenario Name** | Transaction Modification & Ledger Recalculation |
| **User Type** | Any User |
| **Preconditions** | User previously logged an expense of `₹800` under `Shopping`. Now realizes it was actually `₹600` under `Groceries`. |
| **User Action** | On Transactions table, clicks the `Edit` button on the transaction row. In the modal, updates Amount to `₹600`, Category to `Groceries`, and clicks `Save Expense`. |
| **Expected Screen** | Modal closes. Green toast: *"Expense updated successfully!"*. Transaction row reflects `₹600` and `Groceries`. Dashboard total spending decreases by ₹200. Category breakdown adjusts accordingly. |
| **System Behaviour** | Calls `api.updateExpense(id, updatedData)`. In Firestore: calculates the difference ($\Delta = 600 - 800 = -200$). Updates the transaction document, and adjusts the month roll-up document category totals and overall monthly spend. |
| **Expected Result** | Perfect ledger reconciliation; avoids data anomalies where editing an expense corrupts the monthly sum. |
| **Error Handling** | If transaction has been deleted on another device concurrently, shows error toast: *"Transaction not found or already deleted"*. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/05_transactions.spec.js` |

---

### Scenario 3.13: Deleting an Existing Transaction
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-13` |
| **Scenario Name** | Transaction Deletion & Roll-up Netting |
| **User Type** | Any User |
| **Preconditions** | A duplicate or accidental expense of `₹500` exists in the ledger. |
| **User Action** | Navigates to Transactions. Locates row. Clicks `Delete` (trash can icon). Custom confirmation prompt appears: *"Are you sure you want to delete this expense?"*. User confirms. |
| **Expected Screen** | Row fades out with smooth transition. Green toast appears: *"Expense deleted successfully"*. Total spent on Dashboard drops by ₹500. Remaining budget increases by ₹500. |
| **System Behaviour** | Calls `api.deleteExpense(id)`. Deletes `/users/{uid}/transactions/{id}`. Subtracts ₹500 from `/users/{uid}/months/{monthKey}.total_spent` and decrements category total. |
| **Expected Result** | Clean removal with complete mathematical integrity across all charts and stat cards. |
| **Error Handling** | Reverts optimistic UI update if network call fails, showing error toast. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/05_transactions.spec.js` |

---

### Scenario 3.14: Modal Cancellation (Escape Key, Backdrop, or Close Button)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-03-14` |
| **Scenario Name** | Expense Modal Dismissal Without Saving |
| **User Type** | Any User |
| **Preconditions** | `Add Expense` modal is open with partially typed text. |
| **User Action** | User presses keyboard `Escape`, clicks the dark backdrop outside the modal, or clicks the `X` button in the top right. |
| **Expected Screen** | Modal dismisses immediately with slide-down animation. No transaction is saved. No change to ledger. |
| **System Behaviour** | Invokes `onClose()`. Resets local draft state on next open. |
| **Expected Result** | Frictionless escape mechanism conforming to WCAG and desktop usability standards. |
| **Error Handling** | None needed. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/03_expenses.spec.js` |
