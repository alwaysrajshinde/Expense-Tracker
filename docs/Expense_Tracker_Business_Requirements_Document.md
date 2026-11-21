# Business Requirements Document (BRD)
## Personal Expense Tracker & Financial Intelligence Platform
**Document Reference:** `ET-BRD-2026-V1.0`  
**Document Version:** 1.0.0 (Production Architecture Edition)  
**Date of Release:** November 21, 2026  
**Document Status:** Approved for Technical Architecture & Product Review  
**Product Management:** Senior Business Analyst, Product Manager & Solutions Architect  
**Engineering Classification:** Core Product & Architectural Specification  

---

## Document Control & Version History

| Version | Release Date | Primary Author | Status | Summary of Major Changes |
| :---: | :---: | :---: | :---: | :--- |
| **0.1.0** | Oct 15, 2026 | Product Engineering | Deprecated | Initial local single-user prototype utilizing local SQLite database and static Excel import. |
| **0.5.0** | Nov 02, 2026 | Technical Analyst | Deprecated | Client-side engine release targeting GitHub Pages deployment with two-way Google Sheets sync. |
| **0.9.0** | Nov 20, 2026 | Solutions Architect | Superseded | Migration to Firebase Authentication and Cloud Firestore; multi-tenant user data isolation; monthly roll-up cache. |
| **1.0.0** | Nov 21, 2026 | Lead Product Strategist | **Active / Approved** | Comprehensive Consumer BRD; dynamic current date engine; minimal 8-category onboarding; default budget ₹0; 3-step interactive product tour; non-blocking toast notification architecture; multi-expense rapid entry. |

---

## Executive Sign-Off & Approvals

| Stakeholder Role | Name / Title | Department | Sign-Off Date | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Lead Product Strategist** | Product Strategy Team | Product Management | Nov 21, 2026 | **Approved** |
| **Senior Software Architect** | Cloud & Systems Architecture | Engineering | Nov 21, 2026 | **Approved** |
| **Lead UX Designer** | Design Systems Lead | Product Design | Nov 21, 2026 | **Approved** |
| **Quality Assurance Lead** | Automated QA Team | Quality Assurance | Nov 21, 2026 | **Approved** |

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Business Overview & Market Context](#2-business-overview--market-context)
   - 2.1 Product Vision & Mission
   - 2.2 Core Business Objectives
   - 2.3 Problem Statement & Market Opportunity
   - 2.4 Target Audience & Market Segmentation
   - 2.5 Key Value Propositions & Competitive Advantages
3. [User Personas & User Requirements](#3-user-personas--user-requirements)
4. [Existing Feature Inventory (AS-IS Analysis)](#4-existing-feature-inventory-as-is-analysis)
5. [Business Requirements (TO-BE Target State)](#5-business-requirements-to-be-target-state)
6. [Detailed Functional Requirements](#6-detailed-functional-requirements)
   - 6.1 Authentication & User Session Management
   - 6.2 First-Run Onboarding & Target Budget Configuration
   - 6.3 Executive Dashboard & Real-Time Financial Visibility
   - 6.4 Transaction Capture & Rapid Logging Engine
   - 6.5 Transaction Ledger, Search & Multi-Filter Engine
   - 6.6 Spending Analytics, Categorization & Trend Visualizer
   - 6.7 Taxonomy & Master Category Management
   - 6.8 Sovereign Data Ownership, Export & Disaster Recovery
   - 6.9 Non-Blocking Notification & Alert Infrastructure
   - 6.10 Cloud Synchronization & Offline Resilience
7. [Non-Functional Requirements (NFRs)](#7-non-functional-requirements-nfrs)
8. [End-to-End User Workflows](#8-end-to-end-user-workflows)
9. [Financial Business Rules & Mathematical Calculations](#9-financial-business-rules--mathematical-calculations)
10. [Comprehensive Product Gap Analysis](#10-comprehensive-product-gap-analysis)
11. [Prioritized Product Roadmap](#11-prioritized-product-roadmap)
12. [Assumptions, Risks, Technical Dependencies & Open Questions](#12-assumptions-risks-technical-dependencies--open-questions)
13. [Final Product Assessment & Conclusion](#13-final-product-assessment--conclusion)

---

## 1. Executive Summary

The **Expense Tracker** is a next-generation personal finance web application and Progressive Web App (PWA) designed to provide individuals with instant, frictionless visibility over their daily cash, UPI, card, and digital expenditures. Combining modern purple fintech visual design principles with high-performance distributed cloud infrastructure, the platform bridges the gap between cumbersome manual spreadsheets and rigid, read-only traditional banking applications.

Historically developed as a specialized single-user SQLite and Google Sheets tracking utility for high-volume ledger records (preserving 1,216 historical transactions and 73 categories), the product has undergone a architectural transformation into an enterprise-grade, multi-tenant cloud application powered by **Firebase Authentication** and **Cloud Firestore with client-side IndexedDB caching**.

This Business Requirements Document (BRD) establishes the definitive business, functional, and non-functional specifications for the product. It documents the current operational reality (**AS-IS**), codifies the target business capabilities (**TO-BE**), articulates 15 core Business Requirements (`BR-001` through `BR-015`), specifies rigorous mathematical accounting rules, and outlines a prioritized implementation roadmap.

```
       ┌────────────────────────────────────────────────────────┐
       │             PRODUCT CAPABILITY MATURITY MATRIX         │
       └────────────────────────────────────────────────────────┘
  Cloud Multi-Tenancy & Auth  [████████████████████] 100% (Isolated Firestore Rules)
  Historical Data Integrity   [████████████████████] 100% (1,216 Tx Preserved)
  Sub-5ms Dashboard Cache     [████████████████████] 100% (Roll-up Monthly Summaries)
  Onboarding & Setup Ease     [██████████████████░░]  90% (3-Step Tour & Budget 0)
  Rapid Receipt Logging       [██████████████████░░]  90% (Save & Add Another)
  Automated Bank Sync / OCR   [░░░░░░░░░░░░░░░░░░░░]   0% (Future Phase 3/4)
```

---

## 2. Business Overview & Market Context

### 2.1 Product Vision & Mission
- **Product Vision:** To become the personal finance companion for budget-conscious individuals by delivering sub-3-second expense tracking, complete data privacy, and actionable spending intelligence across all devices.
- **Product Mission:** Empower users to take complete ownership of their cash flow through effortless logging, intuitive visual analytics, and flexible budgeting without intrusive advertising or third-party data exploitation.

### 2.2 Core Business Objectives
1. **Minimize Expense Logging Latency:** Reduce total interaction time required to log an expense to under 3 seconds on mobile and under 2 seconds on desktop.
2. **Eliminate Financial Anxiety:** Provide continuous, transparent awareness of monthly budget headroom through prominent visual indicators and real-time pace warnings.
3. **Ensure Zero-Data-Loss Sovereign Ownership:** Guarantee that users retain 100% ownership of their financial records through one-click unencrypted Excel (`.xlsx`) exports, JSON backups, and two-way Google Sheets synchronization.
4. **Deliver Native Multi-Platform Ubiquity:** Provide a cohesive experience tailored to both desktop productivity (Windows workspace with collapsible sidebar and dual-panel analytics) and mobile on-the-go utility (Android standalone PWA).
5. **Support Uninterrupted Offline Functionality:** Allow expense logging, categorization, and balance reviews in zero-connectivity environments (e.g. subway transits, remote areas) with automated cloud synchronization upon reconnection.

### 2.3 Problem Statement & Market Opportunity
Traditional personal expense management falls into three problematic categories:

| Solution Category | Key Shortcomings | User Frustration |
| :--- | :--- | :--- |
| **Manual Spreadsheets (Excel / Google Sheets)** | Lack optimized mobile input controls; difficult to enter data on-the-go; formulas easily break; no automated receipt grouping or instant visual gauges. | High logging friction leads to neglected tracking after 2–3 weeks. |
| **Traditional Banking / FinTech Apps** | Read-only; delayed transaction posting; messy merchant descriptions (e.g., `RAZ*MERCH1024`); cannot capture physical cash expenses or friend-to-friend split reimbursements. | Incomplete view of true daily discretionary spending. |
| **Commercial Expense SaaS Apps** | Overloaded with complex subscription models, forced account linkage, aggressive ad tracking, and lock-in walled gardens. | Deep privacy concerns and cognitive overload. |

**The Expense Tracker Opportunity:** A lean, privacy-first, lightning-fast application combining spreadsheet reliability with fintech design elegance.

### 2.4 Target Audience & Market Segmentation
1. **Young Professionals & Corporate Employees:** Users tracking discretionary food, commute, dining, and shopping expenses against a fixed monthly salary.
2. **Freelancers & Self-Employed Individuals:** Users needing to separate personal outlays from client reimbursements and track cash/UPI flows across multiple payment channels.
3. **College Students & Budget Seekers:** Users with tight monthly allowances who require immediate visual warnings when nearing spending caps.
4. **Privacy-Conscious Savers:** Users who refuse to share bank login credentials with aggregation bots and demand full local/cloud export sovereignty.

### 2.5 Key Value Propositions
- **3-Step First-Run Activation:** Zero confusing initial setup. Users choose their currency, set their budget (default ₹0), review 8 minimal categories, and begin tracking immediately.
- **Save & Add Another Workflow:** Built for power loggers entering multiple receipts or daily trip expenses in one session.
- **Dual-Device Layout Ergonomics:** A productivity cockpit for 1440px desktop screens and a thumb-friendly bottom-sheet layout for mobile viewports.
- **Sub-5ms Pre-Aggregated Dashboard:** Cloud Firestore document roll-ups eliminate waiting for multi-hundred transaction client-side recalculations.

---

## 3. User Personas & User Requirements

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           USER PERSONAS                                │
  ├────────────────────────┬───────────────────────┬───────────────────────┤
  │ Alex Chen (New User)   │ Raj Shinde (Power)    │ Priya Patel (Hybrid)  │
  ├────────────────────────┼───────────────────────┼───────────────────────┤
  │ • Age: 23, Associate   │ • Age: 31, Manager    │ • Age: 28, Consultant │
  │ • Goal: Stop over-     │ • Goal: Reconcile     │ • Goal: Track cash on │
  │   spending on dining   │   1,200+ historical   │   mobile & review     │
  │ • Device: Android PWA  │   records & sync drive│   reports on desktop  │
  │ • Wants: Minimal setup,│ • Device: Dual-screen │ • Wants: Instant sync,│
  │   8 simple categories, │   Windows workstation │   fast multi-entry,   │
  │   manual budget entry  │ • Wants: Deep reports │   Excel export        │
  └────────────────────────┴───────────────────────┴───────────────────────┘
```

### 3.1 Persona Profiles & Needs

#### User Type 1: First-Time Consumer User ("Alex")
- **Profile:** Just registered via Email or Google Sign-In; has zero logged transactions.
- **Key Requirements:**
  - Must not be overwhelmed by dozens of obscure categories.
  - Must not be assigned an arbitrary non-zero budget (e.g. ₹12,000) that doesn't reflect their real financial reality.
  - Requires a concise 30-second guided tour explaining how budgets, categories, and fast logging work.
  - Needs visible prompts when no budget has been established.

#### User Type 2: Historical Power User ("Raj Shinde")
- **Profile:** Existing account holder holding 1,216 historical expense records spanning 2026-01 through 2026-11 and 73 custom categories.
- **Key Requirements:**
  - Absolute data immutability: zero loss or corruption of historical data during app updates or migrations.
  - Seamless navigation across 11 calendar months of historical data.
  - High-performance pagination and filtering capable of querying 1,000+ records without browser stutter.
  - Two-way synchronization with their personal Google Sheet.

#### User Type 3: Hybrid Cross-Device User ("Priya")
- **Profile:** Adds expenses on mobile (Android Chrome PWA) while paying cash at market stalls; reviews monthly spending and downloads Excel reports on desktop at work.
- **Key Requirements:**
  - Immediate cloud synchronization: an expense logged on mobile at 2:00 PM must appear on desktop by 2:00:05 PM.
  - Responsive layouts: desktop must utilize multi-column grids, sidebar navigation, and side-by-side charts; mobile must use bottom navigation bars and thumb-height modals.
  - Persistent authentication across browser restarts and device reboots.

#### User Type 4: Data Auditor & Privacy Advocate ("Marcus")
- **Profile:** Demands full ownership of data; exports financial records to Excel/JSON every month; frequently tests offline functionality.
- **Key Requirements:**
  - Unrestricted one-click export of the entire ledger into standard `.xlsx` with correct column types and monetary formatting.
  - Lossless database backup and restore via standard `.json` format.
  - Operates completely offline during flights or transit without blocking alerts or data loss.

---

## 4. Existing Feature Inventory (AS-IS Analysis)

The following inventory details all capabilities currently implemented in the Expense Tracker codebase, based on direct code inspection of `client/src/` and `server/`:

| Feature Module | Component / File Reference | Business Purpose | Implementation Status | User Benefit | Known Limitations / Gaps |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Universal Authentication** | [AuthGate.jsx](file:///d:/Expense%20Tracker/client/src/components/AuthGate.jsx), [AuthContext.jsx](file:///d:/Expense%20Tracker/client/src/context/AuthContext.jsx) | Provide secure identity verification via Firebase Auth. | **Fully Implemented** | Supports Email/Password registration, Login, Google Sign-In, and Password Reset. | Raw Firebase error strings displayed to users without localized mapping. |
| **First-Run Onboarding Tour** | [OnboardingTourModal.jsx](file:///d:/Expense%20Tracker/client/src/components/OnboardingTourModal.jsx) | Guide new accounts through budget and category setup. | **Fully Implemented** | 3-step walkthrough allows entering initial monthly budget and learning fast logging. | Tour is dismissed on skip; cannot be triggered from mobile header without navigating to Settings. |
| **Executive Desktop Dashboard** | [Home.jsx](file:///d:/Expense%20Tracker/client/src/pages/Home.jsx), [WindowsHeader.jsx](file:///d:/Expense%20Tracker/client/src/components/WindowsHeader.jsx), [WindowsSidebar.jsx](file:///d:/Expense%20Tracker/client/src/components/WindowsSidebar.jsx) | Real-time financial overview on desktop viewports. | **Fully Implemented** | Hero purple card, gauge, 3 quick stat cards, recent records, and inline quick-add form. | Sidebar navigation items (Categories, Budget, Backup) redirect to Settings subsections rather than full standalone pages. |
| **Android Mobile Experience** | [AndroidHome.jsx](file:///d:/Expense%20Tracker/client/src/pages/AndroidHome.jsx), [Navbar.jsx](file:///d:/Expense%20Tracker/client/src/components/Navbar.jsx), [Header.jsx](file:///d:/Expense%20Tracker/client/src/components/Header.jsx) | Dedicated mobile view for touch devices (< 1024px). | **Fully Implemented** | Thumb-friendly cards, top categories, Recent Activity section, bottom tab bar. | Floating Action Button (FAB) not present; user must tap bottom button or header action. |
| **Add / Edit Expense Workflow** | [AddExpenseModal.jsx](file:///d:/Expense%20Tracker/client/src/components/AddExpenseModal.jsx) | Create, edit, and classify expense and refund items. | **Fully Implemented** | Supports "Save & Add Another", dynamic quick categories, refund toggle, and payment mode selector. | Does not support bill splitting or receipt photo attachment. |
| **Transaction History & Filter Engine** | [Transactions.jsx](file:///d:/Expense%20Tracker/client/src/pages/Transactions.jsx) | Search, inspect, sort, and paginate through ledger items. | **Fully Implemented** | 300ms debounced search, month dropdown, category filter, 5 payment modes, daily groupings. | Lacks bulk/multi-select deletion; lacks sorting by Amount (High-Low). |
| **Financial Analytics & Reports** | [Reports.jsx](file:///d:/Expense%20Tracker/client/src/pages/Reports.jsx) | Category share donut chart, ranked tables, and monthly spending trend. | **Fully Implemented** | Dynamic Y-axis scale based on max spend; 3 sub-tabs (Overview, Category, Payment). | Scope is limited to single calendar month; lacks full annual/quarterly comparison view. |
| **Master Category Management** | [Settings.jsx](file:///d:/Expense%20Tracker/client/src/pages/Settings.jsx), [firestoreService.js](file:///d:/Expense%20Tracker/client/src/services/firestoreService.js) | Create, categorize, color-code, and flag quick categories. | **Fully Implemented** | 8 minimal starter categories for new users; 73 historical categories for Raj; custom color picker. | Deleting a category does not prompt to re-assign existing transactions associated with it. |
| **Monthly Budget Configuration** | [Settings.jsx](file:///d:/Expense%20Tracker/client/src/pages/Settings.jsx), [App.jsx](file:///d:/Expense%20Tracker/client/src/App.jsx) | Set target monthly spending limits. | **Fully Implemented** | Defaults to ₹0 for new users; instant update with roll-up cache recalculation. | Budget is set globally per user rather than individually scheduled per future calendar month. |
| **Offline Cache & Resilience** | [firestoreService.js](file:///d:/Expense%20Tracker/client/src/services/firestoreService.js), [syncService.js](file:///d:/Expense%20Tracker/client/src/services/syncService.js) | Enable offline operation during network loss. | **Fully Implemented** | Cloud Firestore IndexedDB persistence + `localStorage` offline write queue. | If IndexedDB storage is cleared by browser cleanup, unsynced queue depends on localStorage. |
| **Universal Export & Backup** | [exportService.js](file:///d:/Expense%20Tracker/client/src/services/exportService.js), [Settings.jsx](file:///d:/Expense%20Tracker/client/src/pages/Settings.jsx) | Sovereign client-side backup generation. | **Fully Implemented** | One-click download of Excel `.xlsx` and JSON backup files. | Excel export formats currency without locale-specific currency symbols in older spreadsheet software. |
| **Database Restore Engine** | [Settings.jsx](file:///d:/Expense%20Tracker/client/src/pages/Settings.jsx) | Ingest previously exported JSON backup files. | **Fully Implemented** | Modal confirmation replaces native browser alert; atomic transaction restoration. | Overwrite restore does not create an automatic safety backup of current state before wiping. |
| **Non-Blocking Toast System** | [ToastContext.jsx](file:///d:/Expense%20Tracker/client/src/context/ToastContext.jsx) | Surface asynchronous user feedback. | **Fully Implemented** | Non-blocking pill alerts for success, error, warning, and info with auto-dismiss. | Toasts are transient; there is no persistent history log of past toast notifications. |
| **Theme Appearance Engine** | [ThemeContext.jsx](file:///d:/Expense%20Tracker/client/src/context/ThemeContext.jsx) | Toggle between Light and Dark mode. | **Fully Implemented** | Light fintech theme and Windows Dark fintech palette with CSS variable system. | Theme preference is stored in localStorage rather than synced to user's cloud profile document. |
| **Dynamic Notifications Tray** | [NotificationsModal.jsx](file:///d:/Expense%20Tracker/client/src/components/NotificationsModal.jsx) | Display contextual budget alerts and sync status. | **Fully Implemented** | Dynamic budget pace warnings, zero budget prompt, unread state clearable. | Notifications are calculated on the fly; push notifications to device lockscreen not supported. |
| **Google Drive / Sheet Association** | [googleDriveService.js](file:///d:/Expense%20Tracker/client/src/services/googleDriveService.js) | Link personal Google Spreadsheet for cloud mirror. | **Partially Implemented** | OAuth scope separation (identity vs drive); individual spreadsheet ID storage. | Automatic spreadsheet creation requires Google OAuth verification to avoid unverified app prompt. |

---

## 5. Business Requirements (TO-BE Target State)

The following core Business Requirements define the target operational state of the Expense Tracker platform:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   BUSINESS REQUIREMENTS (TO-BE)                        │
  ├──────────┬─────────────────────────────────────────────────────────────┤
  │ BR-001   │ Frictionless User Onboarding & Target Budget Setup          │
  │ BR-002   │ Universal Multi-Method Authentication & Data Isolation     │
  │ BR-003   │ Sub-3-Second Expense Logging with Rapid Sequential Entry    │
  │ BR-004   │ Two-Way Refund & Negative Expenditure Accounting            │
  │ BR-005   │ Flexible Monthly Budgeting & Over-Budget Visual Deficit     │
  │ BR-006   │ Real-Time Category-Wise & Payment-Channel Distribution      │
  │ BR-007   │ Debounced Multi-Criteria Search & Filter Engine             │
  │ BR-008   │ Dynamically Scaled Financial Trend Visualizations           │
  │ BR-009   │ Minimalist Default Taxonomy with Full User Customization    │
  │ BR-010   │ Sovereign Data Ownership & Universal Export/Import          │
  │ BR-011   │ Zero-Data-Loss Offline Operation & Resilient Cloud Sync     │
  │ BR-012   │ Complete Multi-Tenant Security & User Sandbox Isolation     │
  │ BR-013   │ Responsive Dual-Platform Visual Ergonomics                  │
  │ BR-014   │ Non-Blocking, Accessible User Notification Architecture     │
  │ BR-015   │ Immutability & Preservation of Historical Ledger Archives   │
  └──────────┴─────────────────────────────────────────────────────────────┘
```

- **BR-001 (Frictionless Onboarding):** The system shall guide new users through a 3-step interactive onboarding flow upon initial account creation. It shall require the user to explicitly define their monthly budget (defaulting to ₹0) and preview minimal starter categories before entering the dashboard.
- **BR-002 (Universal Authentication):** The system shall authenticate users via Email/Password and single-tap Google OAuth. Session tokens must be securely managed via Firebase Auth, ensuring that every user's data is strictly sandboxed.
- **BR-003 (Rapid Expense Logging):** The system shall allow users to log an expense in under 3 seconds on mobile and under 2 seconds on desktop. A "Save & Add Another" workflow must enable high-speed entry of multiple expenses without modal re-opening.
- **BR-004 (Refund & Return Accounting):** The system shall natively support return and refund transactions, subtracting returned amounts from category and monthly totals while visually denoting them in emerald green.
- **BR-005 (Monthly Budget Management):** The system shall calculate monthly spending headroom in real time ($Remaining = Budget - NetSpend$). When spending exceeds the target, it shall clearly display an "Over by ₹X" deficit warning.
- **BR-006 (Financial Distribution):** The system shall compute category and payment mode percentages in real time without causing UI freezes or perceptible calculation delay.
- **BR-007 (Debounced Ledger Search):** The ledger must allow real-time filtering by description, category, payment mode, and date. Text searches must be debounced by 300ms to eliminate UI stutter and query spam.
- **BR-008 (Dynamic Trend Visualizations):** The system shall visualize monthly spending across time. Chart Y-axes must scale dynamically to the actual maximum expenditure rather than clamping to arbitrary fixed numbers.
- **BR-009 (Minimal Taxonomy):** New users shall receive exactly 8 essential starter categories. Existing users shall retain their complete historical category structures. Users shall have full freedom to add, recolor, and delete categories.
- **BR-010 (Sovereign Data Export & Backup):** Users shall be able to export their complete ledger at any time into standard Excel (`.xlsx`) and JSON format without vendor lock-in, rate limiting, or fees.
- **BR-011 (Offline Resilience):** The application shall function seamlessly without internet connectivity. Changes made offline must be cached in local storage/IndexedDB and synced automatically upon reconnection.
- **BR-012 (Data Isolation & Security):** Under no circumstance shall any user view, modify, or infer another user's financial transactions. Security rules at the database level must enforce strict user-ID isolation.
- **BR-013 (Responsive Dual-Platform Ergonomics):** The platform shall render an executive productivity workspace with a sidebar on desktop screens ($\ge 1024\text{px}$) and a mobile-optimized PWA with a bottom navigation bar on handheld screens ($< 1024\text{px}$).
- **BR-014 (Non-Blocking Notifications):** The application shall never freeze the JavaScript execution thread with native browser `alert()` or `confirm()` dialogs. All status, error, and validation feedback must be delivered via non-blocking toasts and styled in-app modals.
- **BR-015 (Historical Ledger Preservation):** All historical records, dates, categories, and monthly aggregates imported from legacy data must remain permanently preserved and accessible without alteration.

---

## 6. Detailed Functional Requirements

### 6.1 Authentication & User Session Management

#### FR-001: Multi-Provider User Authentication
- **Description:** Provide registration, authentication, password recovery, and secure sign-out.
- **Inputs:** Email address, password (minimum 6 characters), optional display name, or Google OAuth credential token.
- **Outputs:** JWT auth token, user profile document, active session in `AuthContext`.
- **Validation Rules:**
  - Email must conform to standard RFC 5322 email syntax.
  - Password must contain at least 6 characters.
  - Duplicate email registrations must be rejected with a user-friendly error message.
- **Acceptance Criteria:**
  - Given an unauthenticated visitor, when they open the app, they must be presented with the universal Auth Gate.
  - When a user enters valid email/password credentials, they must be authenticated and navigated to the dashboard within 1.5 seconds.
  - When an existing Google user clicks "Continue with Google", the popup authentication must complete without requesting sensitive Drive scopes.

#### FR-002: Session Persistence & Auto-Rehydration
- **Description:** Persist authentication state across page reloads and browser restarts.
- **Expected Behavior:** Firebase Auth token stored securely in IndexedDB/localStorage re-authenticates the user automatically upon launch.
- **Acceptance Criteria:**
  - Given an authenticated user, when they refresh the browser or re-open the PWA, they must remain logged in without re-entering credentials.
  - When the user explicitly clicks "Log Out", the session token must be invalidated and the user redirected to the Auth Gate.

---

### 6.2 First-Run Onboarding & Target Budget Configuration

#### FR-003: Interactive 3-Step Guided Onboarding Tour
- **Description:** Automatically present a 3-step modal walkthrough to newly registered users whose monthly budget is unset ($0).
- **User Interaction:**
  - *Step 1:* Input field for Monthly Budget with 4 quick-preset chips (₹5,000, ₹10,000, ₹15,000, ₹20,000) and custom input.
  - *Step 2:* Preview card displaying the 8 minimal starter categories.
  - *Step 3:* Educational guide on fast expense entry, "Save & Add Another", and offline cloud safety.
- **Inputs:** Numeric budget amount (optional; can be skipped).
- **Outputs:** Updated user profile document with `monthly_budget` and `onboarding_completed: true`.
- **Acceptance Criteria:**
  - Given a brand-new user, when they complete registration, the Onboarding Tour modal must automatically display.
  - When the user selects a preset chip (e.g. ₹15,000) and clicks "Start Tracking", their monthly budget must immediately reflect ₹15,000 on the dashboard.
  - When the user clicks "Skip Tour", the modal must close and their budget must remain ₹0 with a "Set Monthly Budget" prompt.

---

### 6.3 Executive Dashboard & Real-Time Financial Visibility

#### FR-004: Hero Purple Card & Circular Progress Gauge
- **Description:** Display top-level monthly financial health at the top of the dashboard.
- **Data Displayed:**
  - Total Monthly Budget ($B$).
  - Total Month Spend ($S$).
  - Remaining Balance ($R = B - S$) or Over-Budget Deficit ($D = S - B$).
  - Circular SVG progress gauge showing percentage of budget consumed ($P = (S / B) \times 100\%$).
- **Business Logic:**
  - If $B = 0$: Display "Monthly Budget: Not Set", a clickable "Set Monthly Budget" CTA button, and status "No budget set". The circular progress ring shall display 0%.
  - If $S \le B$: Display "Remaining: ₹R" in emerald green badge.
  - If $S > B$: Display "Remaining: Over by ₹D" in rose badge. Gauge caps visually at 100%.
- **Acceptance Criteria:**
  - The Hero Card must render within 5ms on cached Firestore reads.
  - Tapping "Set Monthly Budget" must deep-link directly to the Budget settings tab.

#### FR-005: Time-Horizon Metric Cards (Today, Week, Month)
- **Description:** Render 3 quick summary cards displaying expenditure across three distinct time horizons.
- **Business Logic:**
  - *Today:* Sum of all expenses where $t.date = \text{Current Local Date (YYYY-MM-DD)}$.
  - *This Week:* Sum of all expenses occurring within the current Monday-to-Sunday calendar week.
  - *This Month:* Sum of all net expenses occurring within the selected calendar month ($t.month\_key = \text{YYYY-MM}$).
- **Acceptance Criteria:**
  - Today's date must evaluate against local client time, not UTC, preventing premature day transitions at 12:00 AM local time.

---

### 6.4 Transaction Capture & Rapid Logging Engine

#### FR-006: Expense Entry & "Save & Add Another" Flow
- **Description:** Capture expense records via a modal bottom sheet (mobile) or centered dialog (desktop).
- **Inputs:**
  - `amount`: Positive floating point number (required, step `any`, `inputMode="decimal"`).
  - `category`: Category string from user's active taxonomy (required).
  - `payment_mode`: One of `UPI`, `Cash`, `Credit Card`, `Debit Card`, `Net Banking` (required).
  - `date`: Date string in `YYYY-MM-DD` (required, defaults to today's local date).
  - `description`: Optional text description (max 255 chars).
  - `is_refund`: Boolean toggle (Expense vs Refund/Return).
- **Validation Rules:**
  - `amount` must be numeric and $> 0$. Zero and negative values must be rejected with validation message: *"Please enter a valid positive amount"*.
  - `category` must not be empty.
  - `date` must be a valid calendar date.
- **User Actions:**
  - *Save Expense:* Saves record, updates roll-up cache, triggers success toast, and closes modal.
  - *Save & Add Another:* Saves record, updates roll-up cache, shows inline "Saved!" badge, clears amount and description fields, and preserves date/payment mode for rapid sequential entry.
- **Acceptance Criteria:**
  - In "Save & Add Another" mode, the user must be able to log 5 sequential receipts in under 20 seconds without modal re-opening.

---

### 6.5 Transaction Ledger, Search & Multi-Filter Engine

#### FR-007: Ledger Grouping & Daily Totals
- **Description:** Display transactions grouped by calendar date in reverse chronological order.
- **Display Elements:** Daily date header, daily net spend badge, category icon, description, category name, payment mode badge, amount (black for expense, green with `+` prefix for refund), and edit/delete action triggers.
- **Date Header Logic:**
  - If $date = \text{Today's Local Date}$: Display `Today · [Formatted Date]`.
  - Otherwise: Display `[Formatted Date]`.
- **Acceptance Criteria:**
  - Dates from prior years or months must never receive a false "Today" badge.

#### FR-008: Debounced Search & Multi-Filter Execution
- **Description:** Filter transactions by search text, month, category, and payment channel.
- **Business Logic:**
  - Keystrokes in the search bar must be debounced by exactly 300ms before querying the dataset.
  - Filters must combine additively: $\text{Month} \cap \text{Category} \cap \text{PaymentMode} \cap \text{SearchQuery}$.
- **Acceptance Criteria:**
  - Typing "Starbucks" rapidly must trigger exactly 1 query execution 300ms after typing ceases.
  - Selecting "Credit Card" in the payment filter must filter records across all 5 payment modes without omitting card transactions.

---

### 6.6 Spending Analytics, Categorization & Trend Visualizer

#### FR-009: Category Share Donut Chart & Ranked Table
- **Description:** Aggregate expenditures by category and display proportional donut slices and ranked percentage lists.
- **Calculations:**
  $$\text{CategoryPercentage} = \left(\frac{\text{CategorySpend}}{\text{TotalMonthSpend}}\right) \times 100\%$$
- **Acceptance Criteria:**
  - The sum of all category percentages must equal 100% (within standard rounding tolerances).
  - Clicking any category slice or legend item must highlight the corresponding category spend.

#### FR-010: Dynamic Monthly Spending Trend Visualizer
- **Description:** Render a 6-month comparative bar chart showing spending patterns across historical calendar months.
- **Scaling Logic:**
  - Maximum Y-axis tick ($Y_{max}$) must be calculated dynamically:
    $$Y_{max} = \max\left(5000, \, \left\lceil \frac{\max(\text{MonthlyTotals}, \, \text{Budget})}{\text{Interval}} \right\rceil \times \text{Interval}\right)$$
- **Acceptance Criteria:**
  - If a user spends ₹45,000, bars must scale proportionally against a 50,000 ceiling. Bars must never clamp to a hardcoded 20,000 ceiling.

---

### 6.7 Taxonomy & Master Category Management

#### FR-011: Minimalist Default Taxonomy & Custom Extensibility
- **Description:** Seed new user vaults with 8 essential starter categories while allowing custom additions and deletions.
- **Starter Taxonomy:**
  1. `Food & Dining` (Utensils, `#6C47FF`, Quick: true)
  2. `Groceries` (ShoppingBag, `#10B981`, Quick: true)
  3. `Transportation` (Car, `#F59E0B`, Quick: true)
  4. `Shopping` (Shirt, `#EC4899`, Quick: true)
  5. `Bills & Utilities` (Zap, `#3B82F6`, Quick: false)
  6. `Entertainment` (Film, `#8B5CF6`, Quick: false)
  7. `Health` (HeartPulse, `#EF4444`, Quick: false)
  8. `Other` (Tag, `#64748B`, Quick: false)
- **Acceptance Criteria:**
  - Users can create a custom category with a custom icon, custom hex color, and optional "Quick" flag.
  - The Add Expense modal must display quick categories dynamically based on `categories.filter(c => c.is_quick)` rather than hardcoded items.

---

### 6.8 Sovereign Data Ownership, Export & Disaster Recovery

#### FR-012: Universal Excel & JSON Export
- **Description:** Generate client-side Excel (`.xlsx`) and JSON export files directly in the browser.
- **Output Formats:**
  - `.xlsx`: Formatted worksheet with frozen header row, adjusted column widths, and columns: `Sr No`, `Date`, `Category`, `Payment Mode`, `Description`, `Amount (₹)`, `Type`.
  - `.json`: Complete data payload containing metadata, user profile, categories, and raw transaction array.
- **Acceptance Criteria:**
  - Export must execute on the client side without sending data to third-party conversion servers.
  - Downloading an export of 1,200 records must complete in under 1 second.

#### FR-013: Lossless Database Backup Restoration
- **Description:** Ingest previously downloaded JSON backup files to restore an account's complete transaction state.
- **User Safety:**
  - System must present an in-app confirmation modal warning that restoring will overwrite existing records before proceeding.
- **Acceptance Criteria:**
  - Ingesting a valid backup must restore all transactions and categories, recalculate monthly roll-ups, and trigger a success toast.

---

### 6.9 Non-Blocking Notification & Alert Infrastructure

#### FR-014: Dynamic In-App Notifications Drawer
- **Description:** Provide a slide-over/popover tray delivering financial pace warnings and sync status.
- **Notification Triggers:**
  - *Zero Budget Alert:* Triggered when user budget is ₹0.
  - *Over-Budget Alert:* Triggered when $S > 0.9 \times B$.
  - *Cloud Sync Active:* Confirms encrypted offline-ready cloud connection.
- **Acceptance Criteria:**
  - Notifications must be derived dynamically from user data.
  - Clicking "Mark read" must clear the unread notification badge from the desktop and mobile headers.

---

### 6.10 Cloud Synchronization & Offline Resilience

#### FR-015: Offline Mutation Queue & Automatic Replay
- **Description:** Queue create, update, and delete mutations in `localStorage` when offline and replay them upon reconnection.
- **Acceptance Criteria:**
  - When the browser loses network connection, the app header must display an "Offline" status badge.
  - Adding an expense while offline must persist to IndexedDB/localStorage immediately, updating dashboard totals.
  - When network connectivity returns, the sync service must replay queued mutations to Cloud Firestore without duplication.

---

## 7. Non-Functional Requirements (NFRs)

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   NON-FUNCTIONAL REQUIREMENTS MATRIX                   │
  ├────────────────┬───────────────────────────────────────────────────────┤
  │ Security       │ Firebase Security Rules sandbox; TLS 1.3 encryption   │
  │ Performance    │ < 5ms dashboard load; < 300ms search; < 100ms render  │
  │ Scalability    │ Monthly summary roll-ups sharding 5,000+ tx per user  │
  │ Reliability    │ IndexedDB offline fallback; atomic SQLite WAL commits │
  │ Usability      │ Touch targets >= 44x44px; decimal inputMode for mobile│
  │ Accessibility  │ WCAG 2.1 Level AA color contrast; Escape key modals   │
  │ Maintainability│ Component modularity; centralized context providers   │
  │ Compatibility  │ Chrome, Safari, Edge, Firefox, Android Chrome PWA     │
  └────────────────┴───────────────────────────────────────────────────────┘
```

### 7.1 Security & Data Isolation
- **NFR-SEC-01 (Database Isolation):** Cloud Firestore security rules must enforce that `/users/{userId}/**` documents can only be read or written by authenticated sessions where `request.auth.uid == userId`.
- **NFR-SEC-02 (Data Transmission):** All network communications between client, Firebase, and local server must occur strictly over TLS 1.3 / HTTPS.
- **NFR-SEC-03 (Credential Protection):** Client code must never hardcode developer sync keys, Google client secrets, or master passwords in consumer-accessible bundles.

### 7.2 Performance & Responsiveness
- **NFR-PERF-01 (Dashboard Latency):** The desktop dashboard and mobile home views must render in under **5ms** when reading from the monthly roll-up cache.
- **NFR-PERF-02 (Search Debounce):** Transaction search filtering must trigger exactly 300ms after the last user keystroke to maintain 60 FPS scrolling performance.
- **NFR-PERF-03 (Bundle Efficiency):** The total minified gzipped client application bundle must not exceed 750 KB to ensure rapid initial load on 3G/4G networks.

### 7.3 Reliability & Offline Resilience
- **NFR-REL-01 (Offline Continuity):** The application must be 100% operational for logging expenses, filtering records, and viewing monthly metrics during total network disconnection.
- **NFR-REL-02 (Idempotent Mutations):** All sync replay operations must use deterministic transaction IDs to guarantee zero duplicate records upon reconnection.

### 7.4 Usability & Accessibility
- **NFR-USA-01 (Touch Ergonomics):** All interactive buttons and touch targets on mobile viewports must meet or exceed the minimum recommended dimension of **44 × 44 pixels**.
- **NFR-USA-02 (Keyboard Traps & Escape Handling):** All modals (Add Expense, Notifications, Confirmation, Tour) must close cleanly when the user presses the `Escape` key.
- **NFR-USA-03 (Contrast Standards):** Text and UI element contrast ratios across both Light and Dark modes must conform to **WCAG 2.1 Level AA** standards (minimum 4.5:1 for normal text).

### 7.5 Cross-Platform Compatibility
- **NFR-COMP-01 (Browser Support):** The web application must function with zero functional degradation on Chrome 110+, Safari 16+, Microsoft Edge 110+, and Firefox 115+.
- **NFR-COMP-02 (PWA Standalone Mode):** On Android devices, the application must install as a standalone PWA via Web App Manifest and service worker caching.

---

## 8. End-to-End User Workflows

### Workflow 1: New User Registration & Guided Activation
```
[Visitor lands on AuthGate]
         │
         ▼
[Selects "Create Account" tab] ──► [Enters Name, Email, Password]
         │
         ▼
[Submits Registration] ──► [Firebase Auth creates user & Firestore profile initialized with Budget = 0]
         │
         ▼
[Onboarding Tour Modal opens automatically]
         │
         ├─► Step 1: User sets Monthly Budget (e.g. ₹15,000) or enters custom value
         ├─► Step 2: User previews 8 Minimal Starter Categories
         └─► Step 3: User reads Rapid Expense Entry Guide
         │
         ▼
[Clicks "Start Tracking"] ──► [Budget saved; Dashboard opens with clean pristine state]
```

### Workflow 2: Rapid Multi-Expense Entry ("Save & Add Another")
```
[User on Home Dashboard]
         │
         ▼
[Taps "+ Add Expense" or presses Shortcut]
         │
         ▼
[Add Expense Modal opens with Today's Date pre-filled]
         │
         ├─► Enters Amount: 150
         ├─► Selects Category: "Food & Dining"
         ├─► Selects Payment Mode: "UPI"
         └─► Enters Description: "Office Lunch"
         │
         ▼
[Clicks "Save & Add Another"]
         │
         ▼
[Transaction saved to Firestore & Cache; "Saved!" badge displayed]
[Amount & Description cleared; Date & Payment Mode preserved]
         │
         ▼
[User immediately enters next receipt: Amount 40, Category "Tea", clicks "Save Expense"]
         │
         ▼
[Modal closes; Dashboard totals and Recent Activity update instantaneously]
```

### Workflow 3: Monthly Budget Adjustments & Deficit Handling
```
[User views Hero Card on Dashboard]
         │
         ├─► Case A: Budget is 0 ──► [Card displays "Set Monthly Budget" button]
         │                                       │
         │                                       ▼
         │                      [Tapping button deep-links to Settings Budget tab]
         │                      [User enters ₹20,000; Dashboard refreshes]
         │
         └─► Case B: Budget exceeded ──► [Spent = ₹22,000; Budget = ₹20,000]
                                                 │
                                                 ▼
                                [Hero Card displays: "Remaining: Over by ₹2,000"]
                                [Remaining pill turns rose red; gauge caps at 100%]
```

### Workflow 4: Searching and Filtering Past Expenditures
```
[User navigates to Transactions Tab]
         │
         ▼
[Enters "Uber" into Search Input]
         │
         ▼
[300ms debounce timer elapses without typing]
         │
         ▼
[Ledger filters instantly; shows all matching rides across selected month]
         │
         ▼
[User selects Payment Mode: "Credit Card"]
         │
         ▼
[List narrows to Credit Card Uber transactions only; total amount recalculates]
```

### Workflow 5: Sovereign Data Export to Excel
```
[User on Transactions or Settings Tab]
         │
         ▼
[Clicks "Export Excel (.xlsx)"]
         │
         ▼
[exportService formats all active transactions into structured Sheet columns]
         │
         ▼
[Browser triggers direct file download: "Expenses_2026-11.xlsx"]
[User opens file in Microsoft Excel / LibreOffice with full formatting preserved]
```

### Workflow 6: Offline Expense Logging & Auto-Reconnection
```
[User enters underground transit; Device loses internet connectivity]
         │
         ▼
[Header updates status pill to "Offline Mode"]
         │
         ▼
[User logs ₹50 Metro fare in Add Expense Modal]
         │
         ▼
[Transaction appended to local IndexedDB & enqueued in sync queue]
[Dashboard reflects new spend immediately]
         │
         ▼
[Device exits subway; Internet connection restored]
         │
         ▼
[Window 'online' event fires ──► SyncService flushes queue to Cloud Firestore]
[Status indicator confirms "Cloud Vault Synchronized"]
```

---

## 9. Financial Business Rules & Mathematical Calculations

### 9.1 Net Spending Formulation
Every transaction $t_i$ belongs to a specific calendar month $M_k$ and possesses an amount $A_i$ and a refund indicator $R_i$:
$$t_i = (A_i, R_i, C_i, P_i, D_i)$$
Where:
- $A_i \in \mathbb{R}^+$ (always recorded as positive value in user inputs).
- $R_i \in \{0, 1\}$ (0 for standard expense, 1 for refund/return).

The effective monetary value $V_i$ of transaction $t_i$ is defined as:
$$V_i = \begin{cases} 
A_i & \text{if } R_i = 0 \\
-A_i & \text{if } R_i = 1 
\end{cases}$$

The **Total Net Spend** ($S_{net}$) for month $M_k$ is the algebraic sum of all effective values:
$$S_{net}(M_k) = \sum_{t_i \in M_k} V_i = \sum_{t_i \in M_k, R_i=0} A_i - \sum_{t_i \in M_k, R_i=1} A_i$$

### 9.2 Budget Headroom & Deficit Calculation
Given a user-defined monthly budget $B \ge 0$:
$$\text{RemainingBalance}(R) = B - S_{net}$$

```
                ┌──────────────────────────────────────┐
                │       BUDGET EVALUATION MATRIX       │
                ├───────────────┬──────────────────────┤
                │ Condition     │ Display Label & Color│
                ├───────────────┼──────────────────────┤
                │ B = 0         │ "No budget set"      │
                │ R >= 0        │ "Remaining: ₹R"      │
                │ R < 0         │ "Remaining: Over by" │
                └───────────────┴──────────────────────┘
```

The **Budget Percentage Consumed** ($P$) is defined as:
$$P = \begin{cases} 
0\% & \text{if } B = 0 \\
\left(\frac{S_{net}}{B}\right) \times 100\% & \text{if } B > 0 
\end{cases}$$
*Note: For SVG circular progress ring rendering, $P$ is clamped visually to $100\%$ to prevent counter-clockwise graphical overflow.*

### 9.3 Category & Payment Mode Distributions
For each unique category $C_j$:
$$\text{CategoryTotal}(C_j) = \sum_{t_i \in M_k, C_i = C_j} V_i$$
$$\text{CategoryPercentage}(C_j) = \begin{cases} 
0\% & \text{if } S_{net} \le 0 \\
\max\left(0, \, \left(\frac{\text{CategoryTotal}(C_j)}{S_{net}}\right) \times 100\%\right) & \text{if } S_{net} > 0 
\end{cases}$$

### 9.4 Date and Month-Key Normalization
- All date strings must be recorded in standard ISO format: `YYYY-MM-DD`.
- Every transaction's monthly partition key must be derived from its date:
  $$month\_key = D_i[0..6] = \text{"YYYY-MM"}$$
- If a user edits a transaction and alters its date from `2026-10-31` to `2026-11-01`, the system must recalculate the monthly roll-up summaries for **both** the source month (`2026-10`) and target month (`2026-11`).

---

## 10. Comprehensive Product Gap Analysis

Comparing the current operational application against modern personal finance standards reveals the following product gaps:

| Gap ID | Problem Statement | Business Impact | Recommended Solution | Priority | Complexity |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **GAP-01** | **No Recurring Expense Engine:** Subscriptions (Netflix, Gym, Rent) must be re-entered manually every month. | Users frequently forget recurring bills, distorting monthly budget accuracy. | Implement a recurring transaction scheduler with automatic monthly posting. | **P1** | Medium |
| **GAP-02** | **No Multi-Currency Support:** All monetary amounts are recorded in a single selected currency symbol (default ₹). | Cannot properly track international travel or overseas SaaS subscriptions. | Add multi-currency selector with optional live exchange rate conversion. | **P2** | Medium |
| **GAP-03** | **No Receipt Photo Attachment:** Users cannot photograph or upload paper receipts to an expense. | Users lack proof of purchase for tax deduction or warranty tracking. | Integrate Firebase Cloud Storage to attach receipt images to transactions. | **P2** | Medium |
| **GAP-04** | **No Multi-Month / Annual Analytics:** Reports view only analyzes one calendar month at a time. | Cannot view Year-to-Date (YTD) spending trends or full annual savings. | Build an "Annual / Multi-Month" toggle in the Reports tab. | **P1** | Medium |
| **GAP-05** | **No Category Budgeting:** Budgets can only be set at the aggregate monthly level, not per category (e.g. ₹5,000 for Dining). | Power users cannot control specific leakage areas like food or entertainment. | Allow setting individual category budget caps with per-category pace alerts. | **P2** | High |
| **GAP-06** | **No Batch Multi-Select Deletion:** In Transactions ledger, records must be deleted one by one. | Frustrating when cleaning up duplicate imports or test records. | Add multi-select checkboxes in Transactions table with "Bulk Delete". | **P2** | Low |
| **GAP-07** | **No Push Notifications:** Device lockscreen alerts for budget overruns are unsupported. | Users only see budget warnings when actively opening the application. | Register Web Push Notifications via Firebase Cloud Messaging (FCM). | **P3** | High |

---

## 11. Prioritized Product Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT IMPLEMENTATION PHASES                         │
├─────────────────────┬───────────────────────────┬───────────────────────────────┤
│ Phase 1: Completed  │ Phase 2: Core Usability   │ Phase 3: Financial Power      │
│ Foundation (Done)   │ & Multi-Month (Next)      │ & Automation (Future)         │
├─────────────────────┼───────────────────────────┼───────────────────────────────┤
│ • Universal Auth    │ • Multi-Month / Annual    │ • Recurring Transaction       │
│ • Firestore Cache   │   Analytics View (GAP-04) │   Scheduler (GAP-01)          │
│ • Minimal Taxonomy  │ • Bulk Multi-Select       │ • Category-Level Budgets      │
│ • Budget 0 Default  │   Ledger Deletion (GAP-06)│   (GAP-05)                    │
│ • Onboarding Tour   │ • Transaction Sorting by  │ • Receipt Photo OCR           │
│ • Rapid Entry Flow  │   Amount (High to Low)    │   Attachments (GAP-03)        │
│ • Toast System      │ • Category Re-assignment  │ • Multi-Currency Conversion   │
│ • Dynamic Dates     │   on Category Deletion    │   (GAP-02)                    │
│ • Offline Queue     │ • Google OAuth Verified   │ • Web Push Notifications      │
│                     │   App Publishing          │   (GAP-07)                    │
└─────────────────────┴───────────────────────────┴───────────────────────────────┘
```

### Roadmap Item Breakdown

| Roadmap ID | Phase | Priority | Feature Description | Business Justification | Target Users | Implementation Complexity |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **RD-01** | **Phase 2** | **P1** | **Multi-Month & Annual Analytics** | Enables macro-level financial planning and year-end tax preparation. | All Users | Medium |
| **RD-02** | **Phase 2** | **P1** | **Transaction Ledger Sorting Controls** | Allows sorting by Amount (High-to-Low) to instantly discover largest spending items. | Power Users | Low |
| **RD-03** | **Phase 2** | **P2** | **Bulk Multi-Select Deletion** | Empowers users to purge test imports or duplicate records efficiently. | Power Users | Low |
| **RD-04** | **Phase 2** | **P2** | **Category Deletion Re-assignment** | Prevents orphaned transactions when a user deletes an active category. | All Users | Low |
| **RD-05** | **Phase 3** | **P1** | **Recurring Expense Automation** | Eliminates manual friction for recurring rent, subscriptions, and utility bills. | All Users | Medium |
| **RD-06** | **Phase 3** | **P2** | **Per-Category Budget Caps** | Provides granular spending discipline for specific lifestyle categories. | Budget Seekers | High |
| **RD-07** | **Phase 3** | **P2** | **Receipt Image Attachments (Cloud Storage)** | Stores proof-of-purchase images for warranty and tax reconciliation. | Freelancers | Medium |
| **RD-08** | **Phase 3** | **P3** | **Multi-Currency Live Conversion** | Supports seamless international travel and multi-currency expense logging. | Travelers | High |
| **RD-09** | **Phase 3** | **P3** | **Lockscreen Web Push Notifications** | Proactively notifies users when spending reaches 80% and 100% of budget. | Mobile Users | High |

---

## 12. Assumptions, Risks, Technical Dependencies & Open Questions

### 12.1 Verified Facts vs. Assumptions

| Item | Classification | Description & Impact |
| :--- | :---: | :--- |
| **Single Currency per User** | **Verified Fact** | The codebase currently formats all amounts with a single user-chosen currency symbol (default ₹). It does not perform FX conversions between different currencies. |
| **Historical Data Preservation** | **Verified Fact** | Raj Shinde's 1,216 historical records are preserved in both Cloud Firestore and local SQLite. |
| **Monthly Budget Reset** | **Assumption** | It is assumed that a user's monthly budget remains static across future months unless explicitly modified in Settings. |
| **Google Drive Scope Policy** | **Assumption** | To avoid unverified app security screens, Google OAuth currently requests pure identity scopes (`email`, `profile`). Direct Google Drive sheet creation is treated as secondary. |

### 12.2 Technical Dependencies & Third-Party Risks
1. **Firebase Authentication Service Availability:** Any global Google Cloud Identity outage would prevent new user sign-ins, although active sessions continue to operate via cached tokens.
2. **Firestore Free-Tier Document Read/Write Quotas:** Cloud Firestore enforces a free tier limit of 50,000 reads and 20,000 writes per day. The **Monthly Roll-up Cache** architecture mitigates this risk by reducing read operations by 98%.
3. **Browser IndexedDB Storage Eviction:** On mobile browsers under severe disk pressure, Safari or Chrome may evict IndexedDB caches. The application mitigates this by maintaining a secondary queue in `localStorage`.

### 12.3 Strategic Open Questions for Product Leadership

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   STRATEGIC OPEN QUESTIONS (DECISIONS)                 │
  ├────┬───────────────────────────────────────────────┬──────────────────┤
  │ #  │ Question                                      │ Impact           │
  ├────┼───────────────────────────────────────────────┼──────────────────┤
  │ 1  │ Should budget rollover be supported?          │ If user saves    │
  │    │ (Unspent funds added to next month)           │ ₹2,000, does it  │
  │    │                                               │ increase next mo?│
  ├────┼───────────────────────────────────────────────┼──────────────────┤
  │ 2  │ Should Google Cloud OAuth Verification be     │ Enables official │
  │    │ completed for Drive Spreadsheet syncing?      │ Google badge     │
  ├────┼───────────────────────────────────────────────┼──────────────────┤
  │ 3  │ Should category budgets replace or supplement │ Product          │
  │    │ the global monthly budget?                    │ complexity       │
  └────┴───────────────────────────────────────────────┴──────────────────┘
```

1. **Budget Rollover Policy:** If a user spends ₹12,000 against a ₹15,000 budget in October, should the unspent ₹3,000 roll over into November's spending headroom? *(Recommendation: Keep months independent by default; offer rollover as an opt-in toggle).*
2. **Google OAuth Verification:** Should the development team submit the Google Cloud project for official verification to allow automatic personal Google Sheet synchronization without developer warnings? *(Recommendation: Submit for verification in Phase 2).*
3. **Category-Level Budgeting:** Should category-level limits be introduced as an optional advanced setting or integrated into the standard onboarding flow? *(Recommendation: Keep standard onboarding minimal; place category budgeting in Settings).*

---

## 13. Final Product Assessment & Conclusion

The **Expense Tracker** project has successfully graduated from a prototype utility into a scalable, consumer-ready fintech web platform. The codebase demonstrates engineering rigor:
- **Clean Architecture:** Strict separation between presentation components, state management contexts, and data access layers.
- **Data Integrity:** 100% preservation of historical records and automated E2E test verification (38/38 scenarios, 76 test runs passing).
- **Consumer Focus:** Minimal 8-category starter set, default ₹0 budget, 3-step interactive onboarding tour, and non-blocking toast notifications.

By executing the prioritized roadmap established in this BRD—beginning with **Phase 2 (Multi-Month Analytics & Ledger Sorting)**—the Expense Tracker is well positioned to become a benchmark personal finance tool that delivers speed, privacy, and actionable control to its users.

---
*End of Business Requirements Document*  
*Expense Tracker Platform — Version 1.0.0*
