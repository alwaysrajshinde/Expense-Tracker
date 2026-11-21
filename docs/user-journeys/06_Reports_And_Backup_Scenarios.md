# 06. Reports and Backup Scenarios

**Document Reference:** `UJ-DOC-06`  
**Classification:** Financial Analytics, Data Export & Disaster Recovery  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Product Managers, Data Analysts, QA Testers, Solutions Architects  

---

## 1. Financial Analytics Architecture & Visual Reporting

The Reports module (`Reports.jsx`) delivers comprehensive visibility into historical spending behaviors, category distributions, and payment mode preferences. On desktop, it features a sophisticated dual-panel layout, while on mobile it stacks vertically for thumb-friendly scrolling.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REPORTS MODULE ARCHITECTURE                            │
├──────────────────────────────────────────────────────────┬─────────────────────────────┤
│ LEFT PANEL / TOP SECTION                                 │ RIGHT PANEL / BOTTOM        │
├──────────────────────────────────────────────────────────┼─────────────────────────────┤
│ 1. SUMMARY HERO BANNER                                   │ 3. CATEGORY DONUT CHART     │
│    - Total Monthly Spending                              │    - SVG multi-colored arc  │
│    - Daily Average Burn Rate                             │    - Centered Total Display │
│    - Active Budget Comparison                            │    - Top Category Breakdown │
├──────────────────────────────────────────────────────────┼─────────────────────────────┤
│ 2. PAYMENT MODE DISTRIBUTION                             │ 4. CATEGORY BREAKDOWN LIST  │
│    - UPI % and Total Amount                              │    - Category Icon & Pill   │
│    - Cash % and Total Amount                             │    - Exact Spent & % Share  │
│    - Card % and Total Amount                             │    - Mini progress bars     │
└──────────────────────────────────────────────────────────┴─────────────────────────────┘
```

---

## 2. Analytics & Reporting Scenarios

### Scenario 6.1: Monthly Spending Overview & Daily Burn Rate
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-01` |
| **Scenario Name** | Monthly Expenditure & Daily Average Burn Rate |
| **User Type** | Active User |
| **Preconditions** | User has 18 transactions logged in November 2026 totaling `₹8,400`. Days elapsed in month = 21. |
| **User Action** | Navigates to Reports page. |
| **Expected Screen** | Hero banner displays: `Total Spending: ₹8,400`. Daily average burn card calculates: $\frac{8400}{21} = \text{₹400 / day}$. Projected month-end spend card displays: $\text{₹400} \times 30 = \text{₹12,000}$. Comparison to budget displays remaining headroom or overage. |
| **System Behaviour** | Fetches aggregated reports payload via `api.getReports(selectedMonth)`. Derives daily burn rate using current calendar day index. |
| **Expected Result** | Immediate, actionable insight enabling user to moderate spending for the remainder of the month. |
| **Error Handling** | If day 1 of month, sets elapsed days to 1 to avoid division by zero. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/06_reports.spec.js` (Test F1) |

---

### Scenario 6.2: Category Breakdown & Interactive Donut Chart
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-02` |
| **Scenario Name** | Category Donut Chart & Percentage Allocation |
| **User Type** | Active User |
| **Preconditions** | Expenses recorded: `Food & Dining: ₹4,000` (50%), `Groceries: ₹2,400` (30%), `Transportation: ₹1,600` (20%). |
| **User Action** | Views Donut Chart on Reports screen. Hover/taps on the purple `Food & Dining` slice. |
| **Expected Screen** | Donut chart renders 3 distinct proportional colored SVG arcs. Center of donut displays total `₹8,000`. Hovering slice highlights segment and shows tooltip: `Food & Dining: ₹4,000 (50.0%)`. Below the chart, ranked category list displays matching color badges and progress bars. |
| **System Behaviour** | Calculates slice stroke dasharray and dashoffset based on circle circumference ($2\pi r \approx 364.4\text{px}$). Sorts categories descending by total spend. |
| **Expected Result** | Visually engaging, intuitive representation of where the user's money is concentrated. |
| **Error Handling** | If only 1 category exists, renders 100% full circle without mathematical glitch. |
| **Status** | **Implemented** |
| **Screen Reference** | `Reports.jsx` lines 180-260 |
| **Related Test** | `tests/e2e/06_reports.spec.js` (Test F2) |

---

### Scenario 6.3: Payment Mode Distribution Breakdown
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-03` |
| **Scenario Name** | Cash Flow by Payment Mode (UPI vs Cash vs Card) |
| **User Type** | Active User |
| **Preconditions** | Transactions logged: UPI (`₹6,000`), Cash (`₹1,500`), Credit Card (`₹900`). |
| **User Action** | Scrolls to `Payment Methods` section on Reports. |
| **Expected Screen** | Visual cards display: (1) `UPI` with Bank/Smartphone icon: `₹6,000 (71.4%)`, (2) `Cash` with Banknote icon: `₹1,500 (17.9%)`, (3) `Card` with CreditCard icon: `₹900 (10.7%)`. |
| **System Behaviour** | Aggregates payment modes from month roll-up document. Calculates percentage of total spend for each mode. |
| **Expected Result** | Highlights digital payment reliance vs physical cash leakages. |
| **Error Handling** | Unsupported payment modes are grouped under "Other". |
| **Status** | **Implemented** |

---

### Scenario 6.4: Zero Data State on Reports (Empty Month)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-04` |
| **Scenario Name** | No-Data State When Selecting Future or Inactive Month |
| **User Type** | Any User |
| **Preconditions** | User switches month selector in top header to `January 2027` where zero expenses exist. |
| **User Action** | Views Reports tab. |
| **Expected Screen** | Clean empty state graphic with PieChart/BarChart illustration. Headline: *"No financial data recorded for January 2027"*. Subtitle: *"Log your first expense in this month to unlock visual analytics, burn rates, and category distribution."* CTA button: `+ Add Expense`. |
| **System Behaviour** | `reportsData.chart_data` is empty array (`[]`). System bypasses chart math and renders fallback component. |
| **Expected Result** | No broken charts, NaN percentages, or console runtime errors. |
| **Error Handling** | Graceful conditional rendering preventing SVG divide-by-zero crashes. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/06_reports.spec.js` |

---

## 3. Data Sovereign Backup, Export & Disaster Recovery

### Scenario 6.5: One-Click Excel Spreadsheet Export (`.xlsx`)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-05` |
| **Scenario Name** | Complete Ledger Export to Microsoft Excel Format |
| **User Type** | Any User |
| **Preconditions** | User has transactions in ledger. Navigates to Settings > Data tab. |
| **User Action** | Clicks **"Export to Excel (.xlsx)"** button. |
| **Expected Screen** | Button displays brief loading spinner: *"Generating Excel workbook..."*. Browser triggers immediate file download: `Expense_Tracker_Ledger_YYYY-MM-DD.xlsx`. Green toast confirms: *"Excel ledger exported successfully!"*. |
| **System Behaviour** | Queries all user transactions from `/users/{uid}/transactions` ordered by date desc. Utilizes client-side `xlsx` / `SheetJS` library. Builds formatted worksheet with columns: `Date`, `Category`, `Description`, `Amount (INR)`, `Payment Mode`, `Type (Expense/Refund)`. Applies column width auto-fit. |
| **Expected Result** | User possesses a clean, professional, portable spreadsheet usable offline in Microsoft Excel, Apple Numbers, LibreOffice, or Google Sheets. |
| **Error Handling** | If user has 0 transactions, exports clean template with headers and shows informative toast. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` |

---

### Scenario 6.6: Downloading a JSON Backup
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-06` |
| **Scenario Name** | Full Database Backup to JSON |
| **User Type** | Any User / Power User |
| **Preconditions** | User wants an exact programmatic snapshot of their settings, categories, and transactions. |
| **User Action** | In Settings > Data tab, clicks **"Download JSON Backup"**. |
| **Expected Screen** | Browser downloads `expense_tracker_backup_YYYY-MM-DD.json`. Toast confirms download. |
| **System Behaviour** | Serializes user profile, monthly budget, complete category list, and all transactions into structured JSON payload with schema metadata: `version: "1.0"`, `exported_at`, `record_count`. |
| **Expected Result** | Complete disaster recovery artifact created in under 1 second. |
| **Error Handling** | Handled natively by client memory blob generation. |
| **Status** | **Implemented** |

---

### Scenario 6.7: Restoring from a Valid JSON Backup
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-07` |
| **Scenario Name** | Ledger Restoration & Disaster Recovery |
| **User Type** | Returning / Migrating User |
| **Preconditions** | User previously downloaded a valid JSON backup file. User is on Settings > Data tab. |
| **User Action** | Clicks **"Restore from Backup"**, selects `expense_tracker_backup_2026-11-20.json` from file picker, and confirms prompt. |
| **Expected Screen** | Progress modal displays: *"Validating schema... Restoring 45 transactions... Updating monthly summaries..."*. Green toast confirms: *"Restore completed successfully! 45 records loaded."*. Dashboard updates instantly. |
| **System Behaviour** | Validates JSON schema. Checks for duplicate transactions using composite key (`date + amount + category + description`). Imports new records via Firestore `writeBatch()`. Recalculates affected month roll-up cache documents. |
| **Expected Result** | Total data restoration without duplicate entries or data corruption. |
| **Error Handling** | If a record already exists with identical ID/timestamp, system skips duplicate to prevent ledger bloat. |
| **Status** | **Implemented** |

---

### Scenario 6.8: Restoring an Invalid or Corrupted Backup File
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-06-08` |
| **Scenario Name** | Corrupted Backup File Rejection |
| **User Type** | Any User |
| **Preconditions** | User accidentally selects a random image, PDF, or malformed JSON file in the restore dialog. |
| **User Action** | Selects `invoice.pdf` or malformed JSON file and clicks Restore. |
| **Expected Screen** | Restore immediately aborts. High-visibility red alert modal appears: *"Invalid Backup File: The selected file is not a valid Expense Tracker backup. No changes were made to your database."*. |
| **System Behaviour** | Parses file within `try/catch`. Validates required keys (`transactions` array, valid numeric amounts). Upon validation failure, halts execution before any Firestore write. |
| **Expected Result** | Zero damage to existing ledger records; complete database defense against corrupted files. |
| **Error Handling** | Graceful rejection with clear explanation of file requirement. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` |
