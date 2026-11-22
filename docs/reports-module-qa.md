# Reports Module Comprehensive QA & Mathematical Audit

**Module:** Analytics, Reports & Math Calculations  
**Application:** Personal Expense Tracker (PWA)  
**Version:** 2.4.0 (Inked Edition)  
**Date:** November 22, 2026  

---

## 1. Executive Summary

The Reports module was audited to verify calculation correctness, handling of negative amounts / refunds, category property mapping, and smooth month navigation across historical periods.

The audit verified that prior issues—such as disabled month arrows, missing income tracking, absent net balance figures, and blank category labels—have been completely resolved.

---

## 2. Calculation & Mathematical Logic Audit

### 2.1. Transaction Classification & Credit Handling
In `sheetsBackend.js` (`computeReportsFromTransactions`), transactions are evaluated to distinguish debits (expenses) from credits (income, returns, and refunds):

```javascript
const isCredit = Boolean(
  t.is_refund || 
  t.type === 'income' || 
  amt < 0 || 
  (t.category && t.category.toLowerCase() === 'income')
);
```

- **Debit Transactions:** Added to `total_spent` and grouped by category and payment mode.
- **Credit Transactions:** Tracked under `total_income`.
- **Net Cashflow Calculation:**
  $$\text{Net Balance} = \text{Total Income} - \text{Total Spend}$$
  A positive net balance represents savings / surplus cashflow; a negative balance indicates net monthly spend exceeding credits.
- **Budget Pacing:**
  $$\text{Remaining Budget} = \text{Monthly Budget} - \text{Total Spend}$$
  $$\text{Burn Rate (\%)} = \left(\frac{\text{Total Spend}}{\text{Monthly Budget}}\right) \times 100$$

### 2.2. Metric Accuracy Matrix

| Metric | Calculation Method | Edge Case Handling |
| :--- | :--- | :--- |
| **Total Spent** | $\sum |amount|$ for all non-credit transactions | Excludes internal transfers and negative refunds |
| **Income & Credits** | $\sum |amount|$ for all refund, return, or income entries | Handles negative `amount` signs gracefully via `Math.abs` |
| **Net Cashflow** | $\text{Total Income} - \text{Total Spent}$ | Clearly labeled with surplus/deficit indicator |
| **Remaining Budget** | $\text{Target Budget} - \text{Total Spent}$ | Clamped to zero for gauge, shows negative for over-budget |
| **Daily Average** | $\frac{\text{Total Spent}}{\text{Days Elapsed}}$ | Prevents division by zero on day 1 |
| **Projected Month-End** | $\text{Daily Average} \times \text{Days in Month}$ | Adapts dynamically to 28, 29, 30, or 31 days |

---

## 3. Month Navigation & Carousel Architecture

### 3.1. Calendar Stepping vs. Fixed Array Indices
* **Prior Problem:** Month navigation relied strictly on indexing into `available_months`. When the array contained only one element or had gaps, the navigation arrows remained permanently disabled (`disabled={!hasPrev || !hasNext}`).
* **Hardened Stepping:** Replaced index-based lock with bidirectional calendar month stepping:
  ```javascript
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(newKey);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(newKey);
  };
  ```

### 3.2. Direct Month Dropdown Selector
In addition to the forward and backward buttons, a direct `<select>` dropdown was embedded directly inside the month navigation bar:
- Lists all user-active historical months in descending chronological order.
- Provides immediate 1-tap jumping to any historical month without multi-tap stepping.

---

## 4. Subtab Visual & Data Integrity Audit

### 4.1. Overview Subtab
- Displays the 4 primary KPI cards: **Total Spend**, **Income & Credits**, **Net Cashflow**, and **Remaining Budget**.
- Renders spending pacing progress bar and daily velocity.
- Displays responsive spending breakdown donut chart.

### 4.2. Categories Subtab
- **Resolved Bug:** Some transaction objects stored totals under `cat.total`, while others mapped to `cat.amount`.
- **Fix:** Property access was normalized to `cat.total || cat.amount || 0` and category title to `cat.category || cat.name || 'Uncategorized'`.
- Subtab displays: Category Icon, Name, Transaction Count, Total Amount, and Percentage of Overall Spend.

### 4.3. Payment Modes Subtab
- **Resolved Bug:** Property access normalized to `pm.payment_mode || pm.mode || 'UPI'` and amounts to `pm.total || pm.amount || 0`.
- Subtab displays breakdown across UPI, Cash, Credit Card, Debit Card, and Net Banking.

---

## 5. Mobile Viewport Verification

The Reports screen was tested across mobile resolutions (320px to 430px):
- Zero horizontal overflow detected on any tab.
- Month navigation carousel fits cleanly on 320px screens without text truncation.
- KPI cards format neatly into 2×2 mobile grids with comfortable 12px gap.
- All touch buttons satisfy minimum 44px height requirements.

---

*QA document generated and validated locally. Strict Git rule preserved: 0 commits or pushes to remote repository.*
