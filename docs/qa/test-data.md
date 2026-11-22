# Master Test Data Specification — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Test Analyst  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Last Updated:** November 2026  

---

## 1. Overview
This document catalogs all structured test datasets used across manual, automated, functional, security, and edge test executions for the Personal Expense Tracker. All datasets are designed to test standard happy paths, data validation gates, boundary limits, and multi-tenant security barriers.

---

## 2. Test User Accounts & Identities

| Account Persona | Email Address | Display Name | Role / Purpose | Monthly Budget | Default Currency | Data Isolation Scope |
|---|---|---|---|---|---|---|
| **Primary Production / Historical** | `raaajshinde@gmail.com` | Raj Shinde | Primary production owner with extensive historical dataset (117+ txs) | ₹12,000 | ₹ (INR) | Isolated to `users/raj_shinde` |
| **Standard Test User A** | `qa.user.alpha@expensetracker.internal` | Alpha Tester | Standard test persona for CRUD & reports verification | ₹15,000 | ₹ (INR) | Isolated to `users/qa_alpha` |
| **Standard Test User B** | `qa.user.beta@expensetracker.internal` | Beta Tester | Multi-tenant security isolation persona (checks cross-user leaks) | ₹25,000 | ₹ (INR) | Isolated to `users/qa_beta` |
| **Unverified / Fresh User** | `qa.fresh.newbie@expensetracker.internal` | Fresh User | Verifies empty state handling, onboarding welcome, default 15 categories | ₹0 (Unset) | ₹ (INR) | Isolated to `users/qa_fresh` |
| **Demo / Guest User** | `guest@expensetracker.local` | Guest Explorer | Verifies local state / SQLite fallback without cloud auth | ₹10,000 | ₹ (INR) | Ephemeral / Local SQLite |

---

## 3. Expense Input & Amount Datasets

### A. Valid Standard Amounts
| Dataset ID | Amount | Category | Payment Mode | Description | Date | Expected Handling |
|---|---|---|---|---|---|---|
| **DATA-EXP-001** | `₹350` | Food & Dining | UPI | Office lunch with team | `2026-11-22` | Standard transaction; updates KPIs |
| **DATA-EXP-002** | `₹1,250` | Groceries | Cash | Weekly vegetables & fruits | `2026-11-21` | Standard transaction |
| **DATA-EXP-003** | `₹2,499` | Shopping | Credit Card | Winter fleece jacket | `2026-11-18` | Standard transaction |
| **DATA-EXP-004** | `₹85` | Transportation | UPI | Metro card recharge | `2026-11-15` | Small expense transaction |
| **DATA-EXP-005** | `₹8,500` | Housing & Rent | Net Banking | Monthly apartment maintenance | `2026-11-01` | High-value expense |

### B. Boundary & Edge Amounts
| Dataset ID | Amount Input | Type | Description | Expected Validation Outcome |
|---|---|---|---|---|
| **DATA-EDGE-001** | `0` | Zero amount | Zero rupee expense | **REJECTED**: Validation error "Amount must be greater than 0" |
| **DATA-EDGE-002** | `-500` | Negative amount | Negative expense | **REJECTED**: Form parser strips minus or blocks submission |
| **DATA-EDGE-003** | `0.01` | Minimum positive float | Smallest fractional currency | **ACCEPTED**: Handled as valid minimum fraction |
| **DATA-EDGE-004** | `99999999` | Maximum boundary amount | ₹9.99 Crores | **ACCEPTED**: No integer overflow; formatted with proper commas (`₹9,99,99,999`) |
| **DATA-EDGE-005** | `12.3456` | Multi-decimal float | 4 decimal places | **NORMALIZED**: Formatted to 2 decimals (`₹12.35`) or integer |
| **DATA-EDGE-006** | `abc`, `NaN`, `null` | Non-numeric strings | Text characters in amount field | **REJECTED**: Sanitized by numeric mask or blocked by validation |

---

## 4. Text Descriptions, Emojis & Security Payloads

| Dataset ID | Description Input | Type | Security Classification | Expected Handling |
|---|---|---|---|---|
| **DATA-SEC-001** | `<script>alert('xss')</script>` | Script tag injection | High Risk (XSS) | **SANITIZED**: Rendered harmlessly as text; zero script execution |
| **DATA-SEC-002** | `<img src="x" onerror="alert(1)">` | HTML attribute injection | High Risk (XSS) | **SANITIZED**: HTML stripped/escaped; harmless text display |
| **DATA-SEC-003** | `Robert'); DROP TABLE transactions;--` | SQL injection string | High Risk (SQLi) | **PARAMETRIZED**: Safe parametrized query execution |
| **DATA-SEC-004** | `🍕🍔 Coffee with friends at Starbucks ☕✨` | Unicode & Emojis | Standard UX | **PERSISTED**: Correctly stored and displayed without encoding errors |
| **DATA-SEC-005** | `A`.repeat(350) (350 characters long text) | Boundary length string | Buffer / UI Overflow | **CONTAINED**: Truncated cleanly in table rows with ellipsis (`...`) |

---

## 5. Calendar Dates & Temporal Boundaries

| Dataset ID | Date Input | Boundary Significance | Expected System Behaviour |
|---|---|---|---|
| **DATA-DATE-001** | `2026-11-22` | Today's exact date | Highlighted as "Today" in transactions feed |
| **DATA-DATE-002** | `2024-02-29` | Leap Year Leap Day | Handled as valid historical date without rollover |
| **DATA-DATE-003** | `2026-12-31` | Year-End Boundary | Grouped in 2026 annual report; month key `2026-12` |
| **DATA-DATE-004** | `2026-01-01` | Year-Start Boundary | Grouped in 2026 annual report; month key `2026-01` |
| **DATA-DATE-005** | `2027-05-15` | Future Calendar Date | Blocked from report navigation; future months disabled |

---

## 6. Categories Dataset

### Standard 15 Default System Categories
1. `Food & Dining` (Icon: `Utensils`, Color: `#6C47FF`)
2. `Groceries` (Icon: `ShoppingBasket`, Color: `#10B981`)
3. `Transportation` (Icon: `Car`, Color: `#F59E0B`)
4. `Housing & Rent` (Icon: `Home`, Color: `#6366F1`)
5. `Bills & Utilities` (Icon: `Lightbulb`, Color: `#3B82F6`)
6. `Shopping` (Icon: `ShoppingBag`, Color: `#EC4899`)
7. `Health & Medical` (Icon: `HeartPulse`, Color: `#EF4444`)
8. `Personal Care` (Icon: `Sparkles`, Color: `#F43F5E`)
9. `Entertainment` (Icon: `Film`, Color: `#8B5CF6`)
10. `Education` (Icon: `BookOpen`, Color: `#0EA5E9`)
11. `Travel` (Icon: `Plane`, Color: `#F97316`)
12. `EMI & Loans` (Icon: `CreditCard`, Color: `#64748B`)
13. `Gifts & Donations` (Icon: `Gift`, Color: `#D946EF`)
14. `Subscriptions` (Icon: `Repeat`, Color: `#14B8A6`)
15. `Other` (Icon: `MoreHorizontal`, Color: `#94A3B8`)

### Custom Test Categories
- `Pet Care` (Icon: `PawPrint`, Color: `#10B981`)
- `Mutual Fund / SIP` (Icon: `TrendingUp`, Color: `#00D26A`)
- `Gadgets & Tech` (Icon: `Laptop`, Color: `#3B82F6`)

---

## 7. Device Viewport Matrix

| Viewport Profile | Width | Height | Target Device Archetype | Primary Focus |
|---|---|---|---|---|
| **VP-01: Ultra-Compact** | 320px | 568px | iPhone SE 1st Gen / Small Android | Minimum boundary width, no text clipping |
| **VP-02: Standard Mobile** | 360px | 640px | Galaxy S8/S9 / Core Android | Single-page Add Expense form fit |
| **VP-03: Modern Compact** | 375px | 667px | iPhone SE 2nd/3rd Gen, iPhone X/11 | Standard iOS viewport |
| **VP-04: Mainstream Mobile** | 390px | 844px | iPhone 12/13/14/15 Pro | Primary mobile testing target |
| **VP-05: Large Mobile** | 414px | 896px | iPhone Plus / XR / Max | Large mobile viewport |
| **VP-06: Flagship Phablet** | 430px | 932px | iPhone 14/15 Pro Max | High-res mobile viewport |
| **VP-07: Desktop Baseline** | 1280px | 800px | MacBook Air / Standard Desktop | Multi-column grid, side-by-side analytics |
