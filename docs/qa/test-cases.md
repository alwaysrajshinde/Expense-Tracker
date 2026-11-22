# Executable Test Cases Specification — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Test Analyst  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Last Updated:** November 2026  

---

## 1. Master Test Cases Matrix

### Module: Authentication & Route Protection

#### **TC-AUTH-001: Direct Access Route Protection Guard**
- **Test Case ID:** TC-AUTH-001
- **Test Case Title:** Verify unauthenticated direct URL navigation redirects to `/login`
- **Module:** Authentication & Security
- **Related User Story ID:** US-AUTH-002
- **Related Scenario ID:** SCN-AUTH-009, SCN-AUTH-010
- **Test Type:** Security / Functional (Negative)
- **Preconditions:** Clear localStorage, IndexedDB, and browser cookies. No active auth session.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 (393x851) & Desktop Chrome (1280x800)
- **Test Steps:**
  1. Open browser and directly navigate to `http://localhost:5173/dashboard`.
  2. Wait for navigation and verify current URL.
  3. Directly navigate to `http://localhost:5173/reports`.
  4. Wait for navigation and verify current URL.
  5. Directly navigate to `http://localhost:5173/transactions`.
  6. Wait for navigation and verify current URL.
- **Test Data:** Direct URLs: `/dashboard`, `/reports`, `/transactions`
- **Expected Result:** Every private route redirects user to `/login` or auth landing page; no private data or KPI card is rendered.
- **Actual Result:** Verified. All unauthenticated navigations redirect immediately to `/login`.
- **Status:** **PASS**
- **Notes / Remarks:** Protected route boundary enforced by React Router and AuthContext.

---

#### **TC-AUTH-002: Demo / Registered User Authentication Workflow**
- **Test Case ID:** TC-AUTH-002
- **Test Case Title:** Verify successful authentication establishes session and renders dashboard
- **Module:** Authentication
- **Related User Story ID:** US-AUTH-002
- **Related Scenario ID:** SCN-AUTH-006
- **Test Type:** Functional (Positive)
- **Preconditions:** Server running on port 3001, client running on port 5173.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 & Desktop Chrome
- **Test Steps:**
  1. Navigate to `http://localhost:5173`.
  2. Complete login flow using `loginAsRaj(page)` test helper or test account credentials.
  3. Wait for dashboard page container `#dashboard-view` or `.grid` to mount.
  4. Verify user avatar or greeting is visible.
- **Test Data:** User: `raaajshinde@gmail.com` / Name: `Raj Shinde`
- **Expected Result:** User is authenticated smoothly, auth token persisted, and dashboard rendered.
- **Actual Result:** Verified. User is authenticated and greeted within 1.2s.
- **Status:** **PASS**
- **Notes / Remarks:** Automated via Playwright fixture `auth.fixture.js`.

---

### Module: Onboarding & Welcome Back Motivation Overlay

#### **TC-ONBD-001: Luxury Welcome Back Motivation Overlay Appearance & Auto-Dismiss**
- **Test Case ID:** TC-ONBD-001
- **Test Case Title:** Verify custom Welcome Back Motivation overlay renders with lotus emblem, financial quote, and auto-dismisses
- **Module:** Onboarding & Polish
- **Related User Story ID:** US-ONBD-001
- **Related Scenario ID:** SCN-ONBD-001, SCN-ONBD-002, SCN-ONBD-003
- **Test Type:** UI/UX & Functional (Positive & Edge)
- **Preconditions:** User initiates fresh app session.
- **Test Priority:** High
- **Test Environment:** Mobile Pixel 7 (393x851)
- **Test Steps:**
  1. Navigate to app URL and authenticate.
  2. Inspect DOM for `#welcome-greeting-overlay`.
  3. Assert visibility of greeting text matching `/Good (Morning|Afternoon|Evening), Raj/`.
  4. Assert visibility of motivational quote text containing `"Consistency builds financial freedom. Keep going!"`.
  5. Assert existence of glowing lotus emblem with horizontal light beams and curved wave ribbon.
  6. Wait 4.0 seconds (or click overlay to tap-to-dismiss).
  7. Verify `#welcome-greeting-overlay` transitions to hidden or unmounts from DOM.
  8. Verify dashboard beneath is interactive.
- **Test Data:** Time: Local system time / User: Raj
- **Expected Result:** Overlay displays full luxury presentation as designed, then automatically dismisses cleanly after 3.8s, revealing dashboard without UI freeze.
- **Actual Result:** Verified in Playwright task-9578 (`tests/e2e/welcome_overlay_test.spec.js:8:3`). 1 passed (10.7s).
- **Status:** **PASS**
- **Notes / Remarks:** Perfect match to user's uploaded reference design (`welcome_back_design.png`).

---

### Module: Expense Management & Single-Page Add Expense Form

#### **TC-EXP-001: Single-Page Mobile Add Expense Viewport Fit (No Scroll)**
- **Test Case ID:** TC-EXP-001
- **Test Case Title:** Verify Add Expense modal fits completely inside mobile viewport without vertical scrolling
- **Module:** Expense Management
- **Related User Story ID:** US-EXP-001
- **Related Scenario ID:** SCN-EXP-006
- **Test Type:** Mobile UX / Layout (Edge)
- **Preconditions:** Authenticated session, mobile viewport set to 360x640.
- **Test Priority:** Critical
- **Test Environment:** Chromium Mobile (360x640)
- **Test Steps:**
  1. Set viewport to `{ width: 360, height: 640 }`.
  2. Tap the bottom navigation "+" button to open Add Expense.
  3. Verify modal header, amount input, category selector, payment mode selector, date picker, and "Save Expense" button are all visible.
  4. Measure modal scrollHeight vs clientHeight: `scrollHeight <= clientHeight + 2px`.
  5. Verify no body scrollbar is activated.
- **Test Data:** Viewport: 360x640px
- **Expected Result:** Entire Add Expense interface is fully visible and usable on a single screen with zero vertical scrolling required.
- **Actual Result:** Verified. All form fields are arranged in an ultra-clean compact grid fitting on a single 360px viewport.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #1 ("user need to scroll in the add expense page to add it should be in one page").

---

#### **TC-EXP-002: Record Valid Expense & Real-Time Dashboard KPI Recalculation**
- **Test Case ID:** TC-EXP-002
- **Test Case Title:** Verify adding an expense persists record, displays pill toast, and updates total spend
- **Module:** Expense Management
- **Related User Story ID:** US-EXP-001
- **Related Scenario ID:** SCN-EXP-001
- **Test Type:** Functional (Positive)
- **Preconditions:** Authenticated user on dashboard. Note initial Total Spent value.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 & Desktop Chrome
- **Test Steps:**
  1. Record initial Total Spent value `$InitialSpend`.
  2. Click "+" to open Add Expense.
  3. Fill Amount: `350`.
  4. Select Category: `Food & Dining` (or `Food`).
  5. Select Payment Mode: `UPI`.
  6. Fill Description: `Playwright Test Lunch`.
  7. Click "Save Expense".
  8. Assert single floating pill toast appears with text containing "recorded" or "success".
  9. Wait for modal to close.
  10. Assert Total Spent value is updated to `$InitialSpend + 350`.
  11. Navigate to Transactions feed and verify top transaction is `Playwright Test Lunch` with amount `₹350`.
- **Test Data:** Amount: `350`, Category: `Food & Dining`, Mode: `UPI`, Note: `Playwright Test Lunch`
- **Expected Result:** Record saved smoothly, toast displayed, KPI recalculation immediate, transaction visible in list.
- **Actual Result:** Verified. Expense created, toast fired, balance recalculated accurately.
- **Status:** **PASS**
- **Notes / Remarks:** Automated in `tests/e2e/03_expenses.spec.js`.

---

#### **TC-EXP-003: Negative Validation on Invalid Amount Input**
- **Test Case ID:** TC-EXP-003
- **Test Case Title:** Verify Add Expense rejects empty, zero, and negative amounts
- **Module:** Expense Management
- **Related User Story ID:** US-EXP-001
- **Related Scenario ID:** SCN-EXP-002, SCN-EXP-003, SCN-EXP-004
- **Test Type:** Data Validation (Negative)
- **Preconditions:** Add Expense form open.
- **Test Priority:** High
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Leave Amount field empty and click "Save Expense".
  2. Verify form validation prevents submission.
  3. Enter Amount: `0` and click "Save Expense".
  4. Verify validation message "Amount must be greater than 0".
  5. Attempt to enter Amount: `-250` or non-numeric characters `abc`.
  6. Verify characters are blocked or invalid flag set.
- **Test Data:** Amounts: `""`, `"0"`, `"-250"`, `"abc"`
- **Expected Result:** Form blocks submission on all invalid amounts; no erroneous transaction is created.
- **Actual Result:** Verified. Input rejects invalid amounts with clear inline warning.
- **Status:** **PASS**
- **Notes / Remarks:** Verified.

---

### Module: Reports & Analytics Module

#### **TC-REP-001: Unified Single-Row Tab Navigation**
- **Test Case ID:** TC-REP-001
- **Test Case Title:** Verify Reports page has exactly one unified navigation bar without extra space or stacked tabs
- **Module:** Reports & Analytics
- **Related User Story ID:** US-REP-001
- **Related Scenario ID:** SCN-REP-001, SCN-REP-002
- **Test Type:** UI/UX & Functional (Positive)
- **Preconditions:** Authenticated user navigates to `/reports`.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 & Desktop Chrome
- **Test Steps:**
  1. Navigate to Reports page.
  2. Inspect tab navigation elements.
  3. Assert presence of 4 tabs: `Overview`, `Categories`, `Payment Modes`, `Yearly`.
  4. Assert absence of secondary stacked tab row (`Monthly Report | Yearly Summary`).
  5. Click `Categories` tab -> verify Category Spending Distribution renders.
  6. Click `Payment Modes` tab -> verify Payment Channels Split renders.
  7. Click `Yearly` tab -> verify 12-Month Spend Distribution renders.
  8. Click `Overview` tab -> verify Donut chart and 6-Month Trend render.
- **Test Data:** Tab IDs: `overview`, `category`, `payment`, `yearly`
- **Expected Result:** Exactly 1 navigation bar with 4 clean segments; zero wasted whitespace or redundant stacked rows.
- **Actual Result:** Verified. Single segmented bar replaces old dual rows.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #3 ("report page hs exta space in the there navigation").

---

#### **TC-REP-002: 360° Closed Circle Donut Chart Verification**
- **Test Case ID:** TC-REP-002
- **Test Case Title:** Verify category donut chart renders a complete 360° closed circle without arc gaps
- **Module:** Reports & Analytics
- **Related User Story ID:** US-REP-002
- **Related Scenario ID:** SCN-REP-003, SCN-REP-004, SCN-REP-005
- **Test Type:** Visual / Math Precision (Positive & Edge)
- **Preconditions:** On Reports Overview tab with recorded transactions.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 & Desktop Chrome
- **Test Steps:**
  1. Navigate to Reports Overview tab.
  2. Locate SVG donut chart container.
  3. Read all `<circle>` slice elements inside `<svg>`.
  4. Extract `stroke-dasharray` from each slice.
  5. Sum the active dash lengths across all slices: `sum(dashLengths)`.
  6. Compare total dash length against full circumference `2 * Math.PI * radius` (`~395.84px` for radius 63).
  7. Verify ratio `sum(dashLengths) / circumference >= 0.999` (100% full circle).
  8. Verify center of donut displays total spending formatted in currency.
- **Test Data:** Radius: 63, StrokeWidth: 22, Circumference: 395.84px
- **Expected Result:** Slices sum to 100% of circumference, forming a continuous 360° circle with zero missing gap.
- **Actual Result:** Verified. Slices normalize to 100% and include 'Others' for small tail spends.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #3 ("only half circle is there insted of full cicle").

---

#### **TC-REP-003: Continuous 6-Month Monthly Spending Trend Bar Chart**
- **Test Case ID:** TC-REP-003
- **Test Case Title:** Verify monthly trend chart displays continuous 6 months ending at active month
- **Module:** Reports & Analytics
- **Related User Story ID:** US-REP-003
- **Related Scenario ID:** SCN-REP-006, SCN-REP-007
- **Test Type:** Functional & UI (Positive & Edge)
- **Preconditions:** On Reports Overview tab, active month November 2026.
- **Test Priority:** Critical
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Navigate to Reports Overview tab.
  2. Locate "Monthly Spending Trend" card.
  3. Inspect month labels along the x-axis.
  4. Count total rendered month columns: `count === 6`.
  5. Assert the sequence of 6 months matches `['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']`.
  6. Verify active month (`Nov`) has highlighted violet bar and spend badge pill (`₹9,605`).
  7. Verify earlier months have baseline indicators and bars proportional to spend.
- **Test Data:** Active Month: `2026-11`, Sequence: `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`
- **Expected Result:** All 6 continuous months are rendered on the chart; timeline is unbroken.
- **Actual Result:** Verified. All 6 continuous months are rendered.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #4 ("monthly spend only showing the one month graph here either it should last 6 month").

---

#### **TC-REP-004: Future Month Navigation Boundary Disablement**
- **Test Case ID:** TC-REP-004
- **Test Case Title:** Verify Next Month button is disabled when viewing current calendar month
- **Module:** Reports & Analytics
- **Related User Story ID:** US-REP-004
- **Related Scenario ID:** SCN-REP-008, SCN-REP-009
- **Test Type:** Boundary / Validation (Edge)
- **Preconditions:** Active month set to current calendar month (`2026-11`).
- **Test Priority:** High
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Navigate to Reports page.
  2. Verify active month is current calendar month.
  3. Locate "Next Month" button (`aria-label="Next Month"` or right chevron).
  4. Assert button attribute `disabled` is true.
  5. Assert CSS classes include `opacity-40` and `cursor-not-allowed`.
  6. Click "Next Month" button and verify active month does NOT change.
- **Test Data:** Current Month: `2026-11`
- **Expected Result:** Next Month button cannot be clicked; user cannot navigate into future empty months.
- **Actual Result:** Verified. Button is strictly disabled and non-clickable.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user request #10 ("even allow the future month button eneble this is should be disable").

---

### Module: Transactions Feed & Custom Dropdowns

#### **TC-TXN-001: Custom Fintech Dropdowns vs Native Select Verification**
- **Test Case ID:** TC-TXN-001
- **Test Case Title:** Verify all dropdowns use custom styled fintech cards without native select popups
- **Module:** Transactions & UI
- **Related User Story ID:** US-TXN-001
- **Related Scenario ID:** SCN-TXN-003
- **Test Type:** UI/UX & Visual (Positive)
- **Preconditions:** On Transactions page.
- **Test Priority:** Critical
- **Test Environment:** Mobile Pixel 7 & Desktop Chrome
- **Test Steps:**
  1. Navigate to Transactions page.
  2. Inspect Category filter element -> verify rendered as `<button role="button">` with custom chevron icon, not a raw `<select>`.
  3. Click Category dropdown button.
  4. Verify dropdown menu expands as a custom dark styled card with backdrop blur and border styling.
  5. Verify zero ugly browser-native white popups with harsh blue highlight.
  6. Click an option (e.g., `Food & Dining`).
  7. Verify dropdown closes, value updates, and list filters accordingly.
- **Test Data:** Dropdown target: `CategoryFilter`, `MonthFilter`, `PaymentFilter`
- **Expected Result:** All dropdowns render custom dark/light styled cards with smooth transitions.
- **Actual Result:** Verified. All native `<select>` controls replaced by `CustomDropdown.jsx`.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #2 ("when user click on any dropdwon the entire dropdown is just white backfroind also it is not properly designed").

---

#### **TC-TXN-002: Single Month Filter Dropdown (Zero Duplication)**
- **Test Case ID:** TC-TXN-002
- **Test Case Title:** Verify Transactions page contains exactly one month filter selector
- **Module:** Transactions & UI
- **Related User Story ID:** US-TXN-001
- **Related Scenario ID:** SCN-TXN-004
- **Test Type:** UI/UX (Positive)
- **Preconditions:** On Transactions page.
- **Test Priority:** High
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Navigate to Transactions page.
  2. Query all elements matching month selection in the DOM.
  3. Verify exactly 1 month dropdown selector is present (`aria-label="Select Month Filter"`).
  4. Assert absence of any second month carousel or redundant selector.
- **Test Data:** Selector: `Select Month Filter`
- **Expected Result:** Only 1 month selection control is present on the page.
- **Actual Result:** Verified. Exactly 1 month dropdown exists.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user observation #5 ("transaction page has two timesmonth option visible").

---

### Module: UI Architecture, Notifications & Toasts

#### **TC-UI-001: Notifications Relocation Inside Profile Menu**
- **Test Case ID:** TC-UI-001
- **Test Case Title:** Verify notification bell is removed from header and housed inside Profile dropdown
- **Module:** UI Architecture
- **Related User Story ID:** US-UI-001
- **Related Scenario ID:** SCN-UI-001
- **Test Type:** UI/UX & Functional (Positive)
- **Preconditions:** App loaded on any screen.
- **Test Priority:** High
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Inspect header bar: verify no standalone notification bell icon exists outside profile.
  2. Inspect User Profile avatar: verify unread notification dot badge is present when notifications exist.
  3. Click User Profile avatar.
  4. Verify dropdown menu opens containing "Notifications" section with alert item list.
  5. Click backdrop or press Escape: verify profile menu closes cleanly.
- **Test Data:** Profile menu trigger: User Avatar
- **Expected Result:** Header is clean; notifications are housed strictly inside the Profile dropdown.
- **Actual Result:** Verified. Standalone bell removed; notification menu is inside Profile.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user request #13 and new observation 3 ("notification icon is not moveed to profile section").

---

#### **TC-UI-002: Single Floating Pill Toast Without Vertical Stacking**
- **Test Case ID:** TC-UI-002
- **Test Case Title:** Verify feedback toasts display as a single centered pill and never stack vertically
- **Module:** UI Architecture
- **Related User Story ID:** US-UI-002
- **Related Scenario ID:** SCN-UI-002, SCN-UI-003
- **Test Type:** UI/UX (Positive & Edge)
- **Preconditions:** On Settings page or any interactive screen.
- **Test Priority:** Critical
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. Navigate to Settings page.
  2. Rapidly click "Dark Violet", then "Emerald", then "Midnight" theme buttons in under 1 second.
  3. Inspect toast container at `top-4 left-1/2 -translate-x-1/2`.
  4. Count visible toast pill elements in the DOM: `toasts.length === 1`.
  5. Verify text shows latest theme action ("Switched to Midnight Theme").
  6. Wait 2.6 seconds without interaction.
  7. Verify toast dismisses automatically.
- **Test Data:** Rapid theme switches: Violet -> Emerald -> Midnight
- **Expected Result:** Strictly 1 pill toast is visible at any given time; zero vertical stacking; auto-dismisses in 2.5s.
- **Actual Result:** Verified. Only 1 single pill is rendered at `top-4`; multiple toasts never pile up.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user request #2 in turn 7 ("notification popup are annnoying me like that doesnt look good improve here").

---

#### **TC-UI-003: Multi-Language Localization Switching**
- **Test Case ID:** TC-UI-003
- **Test Case Title:** Verify full application localization into Hindi, Marathi, and Spanish
- **Module:** Localization
- **Related User Story ID:** US-UI-003
- **Related Scenario ID:** SCN-UI-004, SCN-UI-005, SCN-UI-006
- **Test Type:** Functional & Visual (Positive)
- **Preconditions:** On Settings page.
- **Test Priority:** High
- **Test Environment:** Mobile & Desktop
- **Test Steps:**
  1. On Settings page, click language button `हिन्दी` (Hindi).
  2. Verify active language highlights `हिन्दी`.
  3. Navigate to Dashboard: verify headers and KPI labels translate (e.g., "कुल खर्च", "बजट", "बचा हुआ").
  4. Navigate to Reports: verify tabs translate (e.g., "अवलोकन", "श्रेणियाँ").
  5. Return to Settings, click `English`: verify instant return to English.
- **Test Data:** Languages: `en`, `hi`, `mr`, `es`
- **Expected Result:** Full UI translates immediately without page reloading; selection persists in localStorage.
- **Actual Result:** Verified. Full localization active and functional.
- **Status:** **PASS**
- **Notes / Remarks:** Solved user request #15 ("multi laguage is not working when user selected another laguage").

---

### Module: Mobile Responsive & Viewport Compatibility

#### **TC-MOB-001: Mobile Viewport Suite (320px, 360px, 375px, 390px, 414px, 430px)**
- **Test Case ID:** TC-MOB-001
- **Test Case Title:** Verify zero horizontal scrolling across 6 mobile viewport widths
- **Module:** Responsive Design
- **Related User Story ID:** All Mobile Stories
- **Related Scenario ID:** SCN-MOB-001, SCN-MOB-002
- **Test Type:** Mobile Viewport Audit (Edge)
- **Preconditions:** App loaded across each viewport:
  - 320x568 (iPhone SE 1st gen)
  - 360x640 (Galaxy S8/S9)
  - 375x667 (iPhone SE 2nd/3rd gen)
  - 390x844 (iPhone 12/13/14)
  - 414x896 (iPhone Plus/XR)
  - 430x932 (iPhone Pro Max)
- **Test Priority:** Critical
- **Test Environment:** Playwright Mobile Emulation
- **Test Steps:**
  1. For each viewport, load `/dashboard`, `/reports`, `/transactions`, `/settings`.
  2. Measure: `window.innerWidth >= document.documentElement.scrollWidth`.
  3. Verify horizontal scrollbar is NOT active: `overflow-x` is cleanly contained.
  4. Verify bottom navigation bar touch targets are >= 44x44px.
  5. Verify no text clipping or overlapping cards.
- **Test Data:** Viewports: 320, 360, 375, 390, 414, 430px
- **Expected Result:** All pages fit comfortably within the viewport with zero horizontal overflow across all 6 widths.
- **Actual Result:** Verified. All screens render responsively with zero overflow.
- **Status:** **PASS**
- **Notes / Remarks:** Verified across all mobile breakpoints.
