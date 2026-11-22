# Comprehensive Test Scenarios — Positive, Negative & Edge Coverage

**Author:** Senior QA Automation Engineer & Test Architect  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Coverage Rule:** Every feature is audited across all three categories: Positive (Happy Path), Negative (Fault Handling & Rejection), and Edge/Boundary (Extreme Limits & Corner Cases).

---

## 1. Authentication & Route Protection

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-AUTH-001** | US-AUTH-001 | Valid email & password registration | **Positive** | User not registered | Critical | Account created, default 15 categories created, user navigated to dashboard |
| **SCN-AUTH-002** | US-AUTH-001 | Registration with existing email | **Negative** | Account already exists | High | Error message "Email already registered" displayed; form preserved |
| **SCN-AUTH-003** | US-AUTH-001 | Password under minimum threshold (<6 chars) | **Negative** | On register page | High | Validation prompt "Password must be at least 6 characters" appears; submit blocked |
| **SCN-AUTH-004** | US-AUTH-001 | Malformed email string (e.g. `user@`, `user.com`) | **Negative** | On register page | High | HTML5 / Regex validation blocks submission; fields highlighted |
| **SCN-AUTH-005** | US-AUTH-001 | Registration with 100-char email and 128-char password | **Edge** | Extreme input strings | Medium | Gracefully handles long valid credentials without overflow or truncation errors |
| **SCN-AUTH-006** | US-AUTH-002 | Valid email/password login | **Positive** | Registered account | Critical | Successful authentication, token persisted, dashboard rendered |
| **SCN-AUTH-007** | US-AUTH-002 | Login with wrong password | **Negative** | Registered account | High | Error toast "Invalid email or password"; password field cleared |
| **SCN-AUTH-008** | US-AUTH-002 | Rapid double-click on Login submit button | **Edge** | Slow network simulated | High | Button disabled during in-flight request; only 1 auth request dispatched |
| **SCN-AUTH-009** | US-AUTH-002 | Direct URL access to `/dashboard` while unauthenticated | **Negative** | No session token | Critical | Route guard intercepts; user redirected to `/login` |
| **SCN-AUTH-010** | US-AUTH-002 | Direct URL access to `/reports` while unauthenticated | **Negative** | No session token | Critical | Route guard intercepts; user redirected to `/login` |
| **SCN-AUTH-011** | US-AUTH-002 | Explicit user logout | **Positive** | User logged in | High | Session cleared, local user caches reset, user redirected to `/login` |

---

## 2. Onboarding & Welcome Back Motivation Overlay

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-ONBD-001** | US-ONBD-001 | Welcome overlay displays on initial app launch | **Positive** | User logs in | High | Overlay renders with lotus emblem, time-based greeting, motivation quote, and glowing ribbon |
| **SCN-ONBD-002** | US-ONBD-001 | Welcome overlay auto-dismisses after 3.8 seconds | **Positive** | Overlay visible | High | Overlay fades out automatically without user touch after 3.8s, revealing dashboard |
| **SCN-ONBD-003** | US-ONBD-001 | Tap-to-dismiss welcome overlay immediately | **Positive** | Overlay visible | High | Tapping anywhere on the overlay dismisses it instantly without delay |
| **SCN-ONBD-004** | US-ONBD-001 | Dynamic greeting time calculation (Morning / Afternoon / Evening) | **Edge** | Clock set to 08:00, 14:00, 20:00 | Medium | 08:00 displays "Good Morning", 14:00 displays "Good Afternoon", 20:00 displays "Good Evening" |
| **SCN-ONBD-005** | US-ONBD-001 | User name fallback when displayName is null/empty | **Edge** | User has no display name | Medium | Gracefully defaults to "Friend" or email username without rendering `null` or `undefined` |

---

## 3. Expense Management & Add Expense Single-Page Form

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-EXP-001** | US-EXP-001 | Record standard expense with valid fields | **Positive** | Logged in, Add Expense open | Critical | Expense saved, single pill toast displayed, dashboard & transactions updated |
| **SCN-EXP-002** | US-EXP-001 | Submit expense with empty amount | **Negative** | Add Expense modal open | Critical | Validation error "Please enter a valid amount"; form submission prevented |
| **SCN-EXP-003** | US-EXP-001 | Submit expense with zero amount (`₹0`) | **Negative** | Add Expense modal open | High | Validation error "Amount must be greater than 0"; submission blocked |
| **SCN-EXP-004** | US-EXP-001 | Submit expense with negative amount (`-₹500`) | **Negative** | Add Expense modal open | High | Rejected by numeric parser; submission blocked |
| **SCN-EXP-005** | US-EXP-001 | Submit expense with non-numeric text (`abc`, `$#@`) | **Negative** | Add Expense modal open | High | Input sanitized; non-digits ignored or flagged invalid |
| **SCN-EXP-006** | US-EXP-001 | Single-page viewport containment on small mobile (360x640) | **Edge / UI** | Viewport 360px wide | Critical | All inputs (Amount, Category, Payment, Date) fit on one page without scrollbar |
| **SCN-EXP-007** | US-EXP-001 | Very large amount (`₹99,99,99,999`) | **Edge** | Add Expense modal open | High | Handled without integer overflow; formatted with proper comma separation in UI |
| **SCN-EXP-008** | US-EXP-001 | Multi-decimal amount (`₹12.3456`) | **Edge** | Add Expense modal open | Medium | Rounded to 2 decimal places (`₹12.35`) or integer as per currency rule |
| **SCN-EXP-009** | US-EXP-001 | Extremely long description (300+ chars) with emojis | **Edge** | Unicode & emojis in text | Medium | Persisted safely without corrupting UI; truncated cleanly in table views |
| **SCN-EXP-010** | US-EXP-001 | Rapid multiple taps on "Save Expense" button | **Edge** | Click 5 times in 200ms | High | Button debounced; exactly 1 transaction created in database |
| **SCN-EXP-011** | US-EXP-002 | Edit existing expense amount and category | **Positive** | Transaction exists | Critical | Values updated in database; KPI cards recalculate instantly |
| **SCN-EXP-012** | US-EXP-002 | Cancel expense editing | **Positive** | Edit modal open | Medium | Modal closes without saving changes; original data intact |
| **SCN-EXP-013** | US-EXP-002 | Delete expense with confirmation modal | **Positive** | Transaction exists | High | Prompt appears; confirming deletes transaction and updates totals |
| **SCN-EXP-014** | US-EXP-002 | Dismiss delete confirmation prompt | **Positive** | Confirmation dialog open | Medium | Transaction is retained; modal closes safely |

---

## 4. Reports & Analytics Module

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-REP-001** | US-REP-001 | Single unified navigation bar on Reports page | **Positive / UI** | On Reports page | Critical | Exactly 1 tab bar visible: `[Overview] [Categories] [Payment Modes] [Yearly]`; zero extra space |
| **SCN-REP-002** | US-REP-001 | Switching between Overview, Categories, Payment, and Yearly | **Positive** | Reports page open | High | Active tab changes instantly; respective graphs and tables render without lag |
| **SCN-REP-003** | US-REP-002 | Donut chart renders complete 360° closed circle | **Positive** | Transactions recorded | Critical | Slices complete full circle (100% circumference); no broken or half circle arc |
| **SCN-REP-004** | US-REP-002 | Donut chart with single dominant category (100%) | **Edge** | 1 category active | High | Single full ring rendered with category color; center shows exact total |
| **SCN-REP-005** | US-REP-002 | Donut chart with small fragmented categories summing < 98% | **Edge** | Multiple small spends | Critical | "Others" category generated automatically; slices normalized to 100% complete ring |
| **SCN-REP-006** | US-REP-003 | Monthly spending trend renders continuous 6 months | **Positive** | Reports Overview active | Critical | Exactly 6 continuous calendar months displayed (e.g., Jun to Nov); baseline visible |
| **SCN-REP-007** | US-REP-003 | Monthly trend with zero-spend months in history | **Edge** | Spend in Nov only | Critical | Months with ₹0 spend still render label and baseline indicator; active month highlighted |
| **SCN-REP-008** | US-REP-004 | Future month navigation button is disabled | **Edge / Validation**| Active month is current calendar month | High | Next Month button (`>`) has `disabled` attribute, reduced opacity, `cursor-not-allowed` |
| **SCN-REP-009** | US-REP-004 | Past month navigation enabled only when historical data exists | **Positive** | Historical months exist | High | Previous Month button (`<`) is clickable; updates report to previous month |
| **SCN-REP-010** | US-REP-004 | Previous month navigation disabled at oldest historical boundary | **Edge** | Oldest month selected | Medium | Previous Month button (`<`) becomes disabled when no earlier data exists |
| **SCN-REP-011** | US-REP-001 | Categories tab shows visual ranking distribution | **Positive** | On Categories tab | High | Horizontal ranked bars displayed for top categories with percentages and transaction counts |
| **SCN-REP-012** | US-REP-001 | Payment Modes tab shows segmented channel progress bar | **Positive** | On Payment Modes tab | High | Segmented progress bar renders color-coded split between UPI, Cash, Card with legend |
| **SCN-REP-013** | US-REP-001 | Yearly tab displays 12-month annual distribution | **Positive** | On Yearly tab | High | 12 monthly bars rendered for selected year, peak spending month KPI calculated |

---

## 5. Transactions Feed, Search & Custom Dropdowns

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-TXN-001** | US-TXN-001 | Real-time text search by description | **Positive** | Transactions feed open | High | Debounced 300ms; filters list matching query; highlights results |
| **SCN-TXN-002** | US-TXN-001 | Search query matching zero transactions | **Negative** | Query "xyznonexistent" | Medium | Empty state card rendered: "No transactions match your search" |
| **SCN-TXN-003** | US-TXN-001 | Unified custom dropdown styling across all filters | **Positive / UI** | On Transactions page | Critical | Dropdowns render custom dark/light styled cards with chevrons (no raw browser-native `<select>`) |
| **SCN-TXN-004** | US-TXN-001 | Single month filter dropdown (no duplicate selectors) | **Positive / UI** | On Transactions page | High | Only 1 month filter dropdown exists on the page; no duplicate carousels |
| **SCN-TXN-005** | US-TXN-001 | 1-Tap "Reset All Filters" | **Positive** | Active filter applied | High | Reset button appears; clicking clears all filters and restores full transaction list |
| **SCN-TXN-006** | US-TXN-001 | Excel export generates valid `.xlsx` file | **Positive** | Filtered list open | High | Downloads spreadsheet containing all filtered rows with proper column headers |
| **SCN-TXN-007** | US-TXN-001 | JSON backup export | **Positive** | Transactions exist | High | Downloads formatted JSON file containing complete transaction records |

---

## 6. UI Polish, Toasts, Profile & Localization

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-UI-001** | US-UI-001 | Notification bell moved strictly inside Profile dropdown | **Positive / UI** | On any page | High | Standalone bell removed from header; Profile avatar shows unread dot; dropdown shows alerts |
| **SCN-UI-002** | US-UI-002 | Single centered floating pill toast without stacking | **Positive / UI** | Trigger multiple actions | Critical | Exactly 1 pill toast visible at `top-4`; new toast replaces previous; zero vertical stacking |
| **SCN-UI-003** | US-UI-002 | Auto-dismiss toast after 2.5 seconds | **Positive** | Toast displayed | High | Toast automatically fades out after 2.5s without user intervention |
| **SCN-UI-004** | US-UI-003 | Multi-language translation into Hindi (हिन्दी) | **Positive** | On Settings page | Critical | All navigation labels, headers, cards, and buttons translate to Hindi immediately |
| **SCN-UI-005** | US-UI-003 | Multi-language translation into Marathi (मराठी) | **Positive** | On Settings page | High | All navigation labels and headers translate to Marathi immediately |
| **SCN-UI-006** | US-UI-003 | Multi-language translation into Spanish (Español) | **Positive** | On Settings page | High | All navigation labels and headers translate to Spanish immediately |
| **SCN-UI-007** | US-UI-004 | Theme switching between Dark Violet, Light, Emerald, Midnight | **Positive** | On Settings page | High | Theme updates instantly; single pill toast confirms switch; persists in localStorage |

---

## 7. Security, Offline & Multi-Device Responsive

| Scenario ID | Story ID | Scenario Description | Scenario Type | Preconditions | Priority | Expected Outcome |
|---|---|---|---|---|---|---|
| **SCN-SEC-001** | US-SEC-001 | Multi-tenant data isolation | **Positive / Security** | User A and User B exist | Critical | User A cannot query or view User B's transactions or custom categories |
| **SCN-SEC-002** | US-SEC-001 | XSS script injection in expense description | **Negative / Security** | Add Expense modal open | Critical | Input `<script>alert('xss')</script>` is sanitized as plain text; no script executed |
| **SCN-OFF-001** | US-OFF-001 | Offline asset caching via Service Worker | **Positive / PWA** | Service Worker active | High | Disconnecting network; app reloads and operates from cache |
| **SCN-OFF-002** | US-OFF-001 | Offline transaction logging and online sync | **Edge / Offline** | Network disconnected | High | Expense saved locally; upon reconnecting, syncs to cloud engine |
| **SCN-MOB-001** | All | Zero horizontal overflow across viewports (320px–430px) | **Edge / Responsive**| Viewport 320px, 360px, 375px, 390px, 414px, 430px | Critical | `document.documentElement.scrollWidth <= window.innerWidth` across all pages |
| **SCN-MOB-002** | All | Minimum touch target size (>= 44x44px) for all buttons | **Positive / Mobile UX**| Mobile viewports | High | All primary buttons and bottom navigation tabs meet or exceed 44x44px touch bounding box |
