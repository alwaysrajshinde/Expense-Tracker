# User Stories & Acceptance Criteria — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Test Analyst  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Last Updated:** November 2026  

---

## 1. Overview
This document specifies formal User Stories and rigorously testable Acceptance Criteria (AC) for all major functional, UI/UX, security, and performance capabilities of the Personal Expense Tracker application. Acceptance criteria explicitly define standard workflows, invalid inputs, boundary conditions, permissions, error handling, and recovery scenarios.

---

## 2. User Stories by Module

### Module 1: Authentication & Onboarding

#### **User Story ID:** US-AUTH-001
**Module:** Authentication  
**User Story:** As an unregistered visitor, I want to create an account using my email and password so that I can securely track my personal finances.  
**Acceptance Criteria:**
1. The registration form must require valid email format and password of at least 6 characters.
2. If the email format is invalid or password is empty/too short, inline validation errors must appear before submission.
3. Submitting an already registered email must display a friendly error message without crashing.
4. Upon successful registration, the account is created, 15 standard default categories are provisioned, and the user is redirected to the dashboard.
5. Passwords must be masked by default with an optional show/hide toggle.

#### **User Story ID:** US-AUTH-002
**Module:** Authentication  
**User Story:** As an existing user, I want to log in with my email and password so that I can access my saved financial records.  
**Acceptance Criteria:**
1. Providing valid registered credentials must authenticate the user, establish the session, and navigate to the dashboard.
2. Entering incorrect credentials must display an error toast/banner ("Invalid email or password") and keep form fields populated (excluding password).
3. The submit button must disable during authentication flight to prevent duplicate requests.
4. Unauthenticated users attempting to access `/dashboard`, `/reports`, `/transactions`, or `/settings` must be redirected immediately to `/login`.

#### **User Story ID:** US-ONBD-001
**Module:** Onboarding & Polish  
**User Story:** As an authenticated user, I want to see a premium, motivational welcome back greeting when I open the application so that I feel encouraged and focused on my financial habits.  
**Acceptance Criteria:**
1. On initial application load after authentication, a luxury dark greeting card overlay must appear.
2. The overlay must feature the glowing purple lotus emblem with horizontal light beams.
3. The greeting must adapt dynamically to local time (`Good Morning, [Name] 👋`, `Good Afternoon, [Name] 👋`, or `Good Evening, [Name] 👋`).
4. The card must present a financial motivation quote (e.g., `"Consistency builds financial freedom. Keep going!"`) flanked by sparkles (`✦` and `✧`).
5. A glowing curved purple wave ribbon must underline the bottom edge of the card.
6. The overlay must automatically dismiss smoothly after 3.8 seconds or immediately upon user tap/click.
7. Dismissing the overlay must reveal the fully loaded dashboard beneath with zero interaction locks.

---

### Module 2: Dashboard & Overview

#### **User Story ID:** US-DASH-001
**Module:** Dashboard  
**User Story:** As a user, I want to see an immediate summary of my monthly finances on the dashboard so that I understand my current spending velocity.  
**Acceptance Criteria:**
1. Dashboard must display KPI cards: Total Spent, Monthly Budget, Remaining Budget, and Today's Spend.
2. Calculations must dynamically reflect all recorded transactions for the active month.
3. If remaining budget is positive, text is formatted in green/emerald; if over-budget, text is formatted in rose/red.
4. Header must display the exact current calendar date (e.g., "Sunday, 22 Nov 2026") prominently.
5. Quick category shortcut chips must be visible and allow 1-tap launching of the Add Expense modal.

---

### Module 3: Expense Management

#### **User Story ID:** US-EXP-001
**Module:** Expense Management  
**User Story:** As a mobile user, I want to record an expense on a single-page form without scrolling so that I can log transactions quickly on the go.  
**Acceptance Criteria:**
1. The Add Expense form must fit entirely within the mobile viewport (320px–430px) without vertical scrolling.
2. User must enter an amount (positive number > 0). Entering 0, negative numbers, or non-numeric characters must be rejected with validation.
3. User must select a category from the custom dropdown or quick category chips.
4. User must select a payment mode (UPI, Cash, Credit Card, Net Banking, Debit Card).
5. Date defaults to today's date; user can pick any valid historical or current date.
6. Submitting the form saves the expense, closes the modal, triggers a single floating pill toast ("Expense recorded successfully"), and updates the dashboard immediately.
7. Submitting with rapid double-clicks must be debounced so duplicate transactions are never created.

#### **User Story ID:** US-EXP-002
**Module:** Expense Management  
**User Story:** As a user, I want to edit or delete an existing expense so that I can correct mistakes or remove erroneous entries.  
**Acceptance Criteria:**
1. Clicking Edit on any transaction opens the expense modal populated with the existing values.
2. Updating values and saving persists the modification and updates the transaction feed and reports.
3. Clicking Delete prompts with a confirmation dialog to prevent accidental loss.
4. Confirming deletion removes the record permanently and recalculates all totals.
5. Cancelling deletion leaves the transaction intact.

---

### Module 4: Category Management

#### **User Story ID:** US-CAT-001
**Module:** Category Management  
**User Story:** As a user, I want to create custom expense categories with custom icons and colors so that I can categorize spending according to my personal lifestyle.  
**Acceptance Criteria:**
1. Category Manager modal must list all default and custom categories with their assigned icon and color.
2. Adding a category requires a unique non-empty category name (up to 30 characters).
3. Attempting to add a duplicate category name must show an error ("Category already exists").
4. User can pick an icon from the Lucide icon roster and a color from the curated hex color palette.
5. Newly created custom category is immediately available in the Add Expense category dropdown.

---

### Module 5: Reports & Analytics

#### **User Story ID:** US-REP-001
**Module:** Reports & Analytics  
**User Story:** As a user, I want a unified single-row tab navigation on the Reports page so that I can toggle between Overview, Categories, Payment Modes, and Yearly summaries without UI clutter.  
**Acceptance Criteria:**
1. Reports page must display a single 4-segment tab bar: `[Overview] [Categories] [Payment Modes] [Yearly]`.
2. Redundant stacked navigation rows and dual switchers must not appear.
3. Switching tabs updates the analytics view seamlessly without page reloading or scroll jumping.
4. Active tab must be styled with high-contrast violet pill styling (`#6C47FF`).

#### **User Story ID:** US-REP-002
**Module:** Reports & Analytics  
**User Story:** As a user, I want the category donut chart to always render a complete 360° closed circle so that the chart feels complete and professional.  
**Acceptance Criteria:**
1. Donut chart SVG slices must complete 100% of the circumference (circumference = `2 * Math.PI * radius`).
2. If visible categories do not sum to 100%, an "Others" category must automatically aggregate the remaining percentage and amount.
3. Slices must be normalized so that under no circumstances is an incomplete arc or half circle displayed.
4. Slices must display their respective category colors, and the center must show total spending for the month.

#### **User Story ID:** US-REP-003
**Module:** Reports & Analytics  
**User Story:** As a user, I want to view a continuous 6-month monthly spending trend bar chart so that I can track month-over-month spending patterns.  
**Acceptance Criteria:**
1. Monthly trend chart must display exactly 6 continuous calendar months ending at the selected month (e.g., `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`).
2. Even if a month had ₹0 spend, its label and a subtle baseline marker must be rendered so the timeline is never broken.
3. The currently selected month must be highlighted with a vibrant purple gradient bar and a spend badge pill.
4. Clicking any historical month in the trend bar navigates to that month's report if data exists.

#### **User Story ID:** US-REP-004
**Module:** Reports & Analytics  
**User Story:** As a user, I want the future month navigation button to be disabled so that I cannot navigate into unrecorded future calendar months.  
**Acceptance Criteria:**
1. In the Month Carousel (`< Month >`), the `Next Month` button (`>`) must be disabled with reduced opacity (`cursor-not-allowed`) when viewing the current calendar month.
2. The `Previous Month` button (`<`) is enabled only when historical data exists prior to the active month.
3. The direct month dropdown must only list valid available months.

---

### Module 6: Transactions & History

#### **User Story ID:** US-TXN-001
**Module:** Transactions  
**User Story:** As a user, I want to filter and search my transaction history with custom fintech dropdowns so that I can locate specific expenses easily.  
**Acceptance Criteria:**
1. Search bar filters transactions in real time with a 300ms debounce.
2. Month, Category, and Payment Mode dropdowns must use custom dark-mode styled cards (`CustomDropdown.jsx`) with custom chevrons and hover highlights (no raw browser-native `<select>`).
3. When any filter is active, a 1-tap "Reset All Filters" pill button must appear.
4. Clicking "Reset All Filters" clears all search inputs and restores default filters.
5. Export buttons allow downloading the filtered dataset as formatted Excel (`.xlsx`) or JSON.

---

### Module 7: UI & Localization

#### **User Story ID:** US-UI-001
**Module:** UI & Navigation  
**User Story:** As a user, I want notification alerts to be housed cleanly inside my Profile menu so that the top header remains clean and un-annoying.  
**Acceptance Criteria:**
1. The standalone notification bell must be removed from the main header and Windows header.
2. Unread notification status is represented by a small notification dot on the user profile avatar.
3. Clicking the Profile avatar opens the dropdown containing the Notifications section alongside Profile and Sign Out.

#### **User Story ID:** US-UI-002
**Module:** UI & Feedback  
**User Story:** As a user, I want feedback toasts to appear as a single floating pill without stacking so that my screen is not cluttered by multiple popups.  
**Acceptance Criteria:**
1. Triggering an action (e.g., switching theme, saving expense) displays a single centered floating pill toast at `top-4 left-1/2 -translate-x-1/2`.
2. Triggering consecutive actions immediately replaces the existing toast; multiple toasts never stack vertically.
3. Toasts auto-dismiss after 2.5 seconds or can be dismissed via the close icon (`X`).

#### **User Story ID:** US-UI-003
**Module:** Multi-Language Support  
**User Story:** As a multilingual user, I want to switch the application language so that I can use the tracker in my native tongue.  
**Acceptance Criteria:**
1. Settings page allows switching between English, Hindi (हिन्दी), Marathi (मराठी), and Spanish (Español).
2. Changing the language updates all navigational tabs, headers, KPI labels, buttons, and form placeholders instantaneously without reloading.
3. The selected language is persisted in `localStorage` across user sessions.

---

### Module 8: Security & Offline Sync

#### **User Story ID:** US-SEC-001
**Module:** Security  
**User Story:** As a user, I want my financial data to be strictly isolated so that no other user can view or alter my records.  
**Acceptance Criteria:**
1. All Firestore queries are partitioned by user ID (`users/{userId}/transactions`).
2. Local database queries enforce user ownership checks.
3. User A logging in on a shared device cannot view cached transactions belonging to User B after logging out.

#### **User Story ID:** US-OFF-001
**Module:** Offline Capability  
**User Story:** As a mobile user, I want to add expenses while offline so that I can record spending even in low or no network connectivity areas.  
**Acceptance Criteria:**
1. When offline (simulated via service worker or network disconnect), the app launches from cache.
2. New expenses recorded offline are queued locally.
3. Upon network reconnection, queued transactions sync automatically to the cloud engine without data loss.
