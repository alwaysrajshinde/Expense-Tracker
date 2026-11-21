# 08. Mobile and Desktop User Experience Specification

**Document Reference:** `UJ-DOC-08`  
**Classification:** Responsive Design, Multi-Platform Ergonomics & PWA Engineering  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** UX/UI Designers, Frontend Engineers, Mobile Developers, QA Automation Engineers  

---

## 1. Architectural Philosophy: Adaptive Multi-Platform Design

Rather than forcing a single mobile layout onto desktop displays (resulting in awkward, empty whitespace) or shrinking a dense desktop table onto phones (causing horizontal scrolling nightmares), the **Expense Tracker** implements an **Adaptive Dual-Persona Architecture**.

The application actively detects viewport dimensions ($\ge 1024\text{px}$ breakpoint) and switches navigation paradigms, layout structures, and interaction models to fit the target form factor.

```
┌───────────────────────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
│             ANDROID MOBILE PWA                │     │               WINDOWS DESKTOP WORKSPACE                │
├───────────────────────────────────────────────┤     ├────────────────────────────────────────────────────────┤
│ • Ergonomics: Thumb-friendly (one-handed)     │     │ • Ergonomics: Mouse & Keyboard productivity            │
│ • Navigation: Bottom Navigation Bar + FAB     │     │ • Navigation: Collapsible Left Sidebar + Top Header    │
│ • Entry Mode: Slide-up Bottom Sheet Modal     │     │ • Entry Mode: Inline Keyboard-Driven Quick Add Form    │
│ • Data View: Vertical Cards & Compact Feeds   │     │ • Data View: Dense Paginated Grid with Filter Chips    │
│ • Analytics: Vertically Stacked Sections      │     │ • Analytics: Side-by-Side Dual-Panel Cockpit           │
└───────────────────────────────────────────────┘     └────────────────────────────────────────────────────────┘
```

---

## 2. Android Mobile Experience

### 2.1 First Launch & PWA Installation
- **Launch Mode:** When opened from Google Chrome on Android, the browser detects the Web App Manifest (`manifest.json`) and active Service Worker (`sw.js`).
- **Install Prompt:** An automatic bottom install banner appears: *"Add Expense Tracker to Home screen"*. When installed, the app receives a standalone application icon with deep purple branding.
- **Standalone Execution:** Tapping the home screen icon launches the app in full-screen standalone mode (`display: "standalone"`), hiding browser address bars and navigation buttons, giving an experience identical to a native APK.

### 2.2 Navigation Paradigm: Bottom Navigation Bar (`Navbar.jsx`)
- Positioned fixed at the bottom with high contrast, safe-area inset padding for modern gesture-based navigation bars.
- Contains 4 core destinations plus 1 floating action button:
  1. `Home` (Dashboard overview)
  2. `Transactions` (Historical ledger feed)
  3. `+` Floating Action Button (FAB): Centered elevated circle with gradient purple fill and drop shadow, opening the `Add Expense` modal immediately.
  4. `Reports` (Charts and spending breakdown)
  5. `Settings` (Configuration and accounts)

### 2.3 Mobile Dashboard Layout (`AndroidHome.jsx`)
- **Header:** Compact top header with current month title, notifications bell with unread dot, and quick theme toggle (moon/sun).
- **Hero Purple Card:** 
  - Vivid purple gradient with rounded 24px corners.
  - Left side: uppercase label `MONTHLY BUDGET`, large bold `Spent: ₹X`, and pills for `Remaining: ₹X` or `Remaining: Over by ₹X`.
  - Right side: circular SVG progress gauge with centered percentage.
- **Quick Stat Cards (3-Column Grid):**
  - Three micro-cards in a single row: `Today`, `This Week`, and `Top Category`.
  - Compact typography with subtle category/calendar icons.
- **Recent Transactions Feed:**
  - Vertically scrolling list showing the latest 5 transactions.
  - Each item displays: Category Icon circle (e.g. orange Car for Auto, green ShoppingBag for Groceries), bold category name, description subtext, date, and colored amount (`-₹250` in dark/light or `+₹500` in green for refunds).
  - Bottom link: *"View All Transactions →"*.

### 2.4 Mobile Expense Logging: Bottom Sheet (`AddExpenseModal.jsx`)
- Slides up from the bottom of the viewport with a tactile spring animation.
- Includes a centered gray pill drag handle (`w-12 h-1.5`) for visual affordance.
- Form controls feature large tap targets ($\ge 44\text{px}$) preventing mis-clicks.
- Quick Category chips displayed as horizontal scrollable pills with icons for rapid thumb selection.
- Two distinct primary action buttons:
  - `Save Expense`: Commits entry and closes sheet.
  - `Save & Add Another`: Commits entry, keeps sheet open, and clears amount for next receipt.

---

## 3. Windows Desktop Experience

### 3.1 Desktop Layout & Spatial Structure (`App.jsx` + `Home.jsx`)
- **Left Collapsible Sidebar (`WindowsSidebar.jsx`):**
  - Width: 260px (expanded) or 72px (collapsed).
  - Top: Expense Tracker logo and title.
  - Navigation links: `Dashboard`, `Transactions`, `Reports`, `Categories`, `Budget`, `Data Backup`, `Settings`.
  - Bottom: User profile pill with avatar, display name, email, and Sign Out button.
- **Top Header Bar (`WindowsHeader.jsx`):**
  - Left: Active page title and breadcrumbs.
  - Center: Month and Year selector dropdown.
  - Right: Search input trigger, Dark/Light mode toggle, Notifications button, and `+ Add Expense` button.

### 3.2 Desktop Dashboard Multi-Column Cockpit
- **Row 1: Primary Metrics:**
  - Left (5 columns): Expanded Hero Purple Card with large circular gauge and explicit `Set Monthly Budget` button.
  - Right (7 columns): Expanded Stat Cards for `Today's Spend`, `This Week's Spend`, and `Month Burn Rate`.
- **Row 2: Inline Quick Add Form:**
  - A permanent horizontal form widget positioned directly below the stat cards.
  - Enables rapid desktop data entry: `[ Amount (₹) ]` `[ Category Dropdown ]` `[ Payment Mode ]` `[ Date Picker ]` `[ Description ]` `[ + Add Button ]`.
  - Submitting via `Enter` key saves the expense, displays an inline checkmark and toast, and refocuses the amount input for uninterrupted typing.
- **Row 3: Dual-Panel Split:**
  - Left: Interactive Category Distribution Donut Chart with hover tooltips and colored percentage legend.
  - Right: Real-time Recent Transactions table with clickable rows, category badges, payment mode chips, and hover actions (Edit / Delete).

### 3.3 Desktop Transactions Ledger (`Transactions.jsx`)
- Full-width tabular presentation with columns: `Date`, `Category`, `Description`, `Payment Mode`, `Amount`, `Actions`.
- Top Toolbar:
  - Debounced search bar (filters description and category with 300ms delay).
  - Category multi-select filter dropdown.
  - Payment mode filter dropdown.
  - Date range picker.
  - `Export to Excel (.xlsx)` action button.
- Pagination controls with page size selector (`10`, `25`, `50` rows per page).

### 3.4 Desktop Reports Analytics (`Reports.jsx`)
- **Left Panel (5 Columns):**
  - Spending overview summary cards.
  - Daily average burn rate and projection calculations.
  - Payment method distribution cards (UPI vs Cash vs Card) with comparative visual progress bars.
- **Right Panel (7 Columns):**
  - Large Category Donut Chart.
  - Detailed category ranking table with exact rupee sums, percentage of total budget, and transaction counts.

---

## 4. Multi-Platform Experience Comparison Matrix

| Feature / Dimension | Android Mobile PWA | Windows Desktop Workspace |
| :--- | :--- | :--- |
| **Viewport Target** | $< 1024\text{px}$ (Phones & small tablets) | $\ge 1024\text{px}$ (Laptops, Desktops, Ultrawides) |
| **Primary Navigation** | Bottom Navigation Bar (4 tabs + FAB) | Left Collapsible Sidebar + Top Header |
| **Expense Entry Mode** | Slide-up Bottom Sheet Modal | Modal + Inline Quick Add Widget |
| **Keyboard Ergonomics** | Mobile Virtual Keyboard (Numeric keypad on amount) | Full Physical Keyboard (`Enter` submit, `Esc` close) |
| **Information Density** | Moderate, vertical card flow | High, multi-column modular grid |
| **Transactions View** | Card feed with swipe affordances | Dense sortable table with column headers |
| **Reports Presentation** | Vertically stacked sections | Side-by-side dual panel cockpit |
| **Excel Export Access** | Settings > Data tab | Persistent button on Transactions toolbar & Settings |
| **Offline Support** | Service Worker + IndexedDB PWA Cache | Service Worker + Browser IndexedDB Cache |
| **Touch Optimization** | $\ge 44\text{px}$ touch targets, thumb-zone controls | Hover states, pointer cursors, tooltip triggers |
