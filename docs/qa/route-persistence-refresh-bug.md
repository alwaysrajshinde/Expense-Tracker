# QA Engineering Report: Route Persistence & Application Refresh Bug Resolution

**Report ID:** QA-ROUTE-PERSISTENCE-031  
**Defect Reference:** DEF-031 / BUG-MOB-32  
**Date:** November 23, 2026  
**Status:** VERIFIED & RESOLVED  
**Platform Compatibility:** Windows Desktop (1280px+), Mobile PWA (393px, 360px), GitHub Pages Static Hosting  

---

## 1. Executive Summary

A critical user experience defect was identified where refreshing the browser redirected the user to the main Overview/Home page, completely discarding the active page context (e.g. Transactions, Reports, More, Monthly Budget, Category Manager, or nested settings). 

The application architecture has been upgraded with a deterministic, hash-based client-side routing and session synchronization engine (`routeService.js`), direct URL deep-linking, browser history (Back / Forward) integration, unauthenticated route preservation with post-login restoration, and full GitHub Pages 404 SPA fallback handling (`client/public/404.html`).

---

## 2. Root Cause Analysis

1. **State-Isolated Navigation Without URL Binding:**
   The application managed screen transitions via React state (`activeTab = useState('home')` and `settingsSection = useState(null)` in `App.jsx`). None of these state transitions updated the browser URL or hash.
2. **Hardcoded Initializer on Page Mount:**
   On every page reload or browser refresh, `MainApp` remounted, resetting `activeTab` directly to `'home'` and `settingsSection` to `null`.
3. **Missing PopState / History Integration:**
   Native `popstate` handlers only evaluated overlay dialog visibility and completely ignored browser history transitions between pages.
4. **Unauthenticated Redirect Route Oblivion:**
   When an unauthenticated user accessed a direct link, `AuthGate` displayed the authentication form but failed to record the intended route destination, causing all logins to default to Overview.
5. **Static Server 404 Potential on GitHub Pages:**
   Without a dedicated GitHub Pages SPA fallback (`404.html`), direct navigation to path-based routes on static web hosts could trigger HTTP 404 errors.

---

## 3. Engineering Implementation

### A. Centralized Route Service (`client/src/services/routeService.js`)
- **Route Parsing (`parseRoute`)**: Inspects `window.location.hash`, `window.location.pathname` (normalizing GitHub Pages repository prefixes `/Expense-Tracker/`), search parameters, and `sessionStorage`.
- **Supported Route Matrix**:
  - `#/` / `#/overview` / `#/home` → Overview / Dashboard
  - `#/transactions` → Transactions List & Filters
  - `#/reports` → Reports Analytics (`Overview` sub-tab)
  - `#/reports?tab=category` → Reports Analytics (`Categories` sub-tab)
  - `#/reports?tab=payment` → Reports Analytics (`Payment Modes` sub-tab)
  - `#/reports?tab=yearly` → Reports Analytics (`Yearly` sub-tab)
  - `#/more` / `#/settings` → Settings & Preferences
  - `#/settings/budget` / `#/budget` → Monthly Budget Settings
  - `#/settings/categories` / `#/categories` → Category Management
  - `#/settings/appearance` → Appearance, Theme & Font Size
  - `#/settings/export` → Data Export & Cloud Backup
  - `#/settings/security` → Security, PIN & Authentication
  - `#/settings/profile` → User Profile & Display Name
  - `#/settings/language` → Language Selection
- **History & URL Synchronization (`syncRouteToUrl`)**:
  Canonical hash is updated via `history.pushState` on page transitions and `history.replaceState` on load/tab switching, backed by `sessionStorage.setItem('expense_tracker_active_route', ...)`.
- **Intended Route Preservation (`saveIntendedRoute` & `consumeIntendedRoute`)**:
  Caches the requested destination when unauthenticated and restores it immediately upon successful login.

### B. Application State Binding (`client/src/App.jsx`)
- Initial state reads directly from `routeService.parseRoute()`:
  `const [currentRoute, setCurrentRoute] = useState(() => routeService.parseRoute());`
  `const [activeTab, setActiveTab] = useState(() => currentRoute.isValid ? currentRoute.tab : 'not_found');`
  `const [settingsSection, setSettingsSection] = useState(() => currentRoute.section || null);`
  `const [reportsActiveTab, setReportsActiveTab] = useState(() => currentRoute.reportsTab || 'overview');`
- Integrated `handleNavigate` across all desktop sidebar and mobile navbar controls.
- Registered continuous `hashchange` and `popstate` event listeners so browser Back and Forward navigation update the UI synchronously.

### C. Friendly Invalid Route Fallback (`client/src/components/NotFoundRoute.jsx`)
- When an unknown route (e.g. `#/unknown-xyz`) is accessed, the application renders a clean Dark Violet "Page Not Found" card with the requested path badge and a "Go to Overview" action, rather than silently redirecting.

### D. GitHub Pages SPA Redirect (`client/public/404.html`)
- An RFC-compliant SPA redirect script packages direct path requests into client-side hashes upon 404 intercepts, completely preventing static server error pages on GitHub Pages deployments.

---

## 4. Playwright Automated Verification Suite

**Test Script:** `tests/e2e/27_route_persistence_refresh_audit.spec.js`  
**Execution Matrix:** `chromium-desktop` (1280x800) and `chromium-mobile` (393x851)  

| # | Test Scenario | Verified Assertions |
|---|---|---|
| 1 | Page Refresh on Main Pages | Refresh on Overview (`#/overview`), Transactions (`#/transactions`), Reports (`#/reports`), and More (`#/more`) keeps user on exact page without returning to Overview. |
| 2 | Page Refresh on Nested Settings | Refresh on Budget (`#/settings/budget`), Categories (`#/settings/categories`), and Reports sub-tabs (`#/reports?tab=category`) retains modal open state and active tab. |
| 3 | Browser Back & Forward Navigation | 10-step sequence: Overview → Transactions → Reports → More → Back → Back → Back → Forward → Forward → Refresh keeps exact state. |
| 4 | Direct URL Access | Direct URL navigation to `/#/transactions` and `/#/settings/categories` loads intended view immediately without flashing. |
| 5 | Invalid Route Fallback | Non-existent route `/#/nonexistent-route-xyz` renders 404 card; clicking "Go to Overview" restores dashboard at `#/overview`. |
| 6 | Unauthenticated Route Restoration | Unauthenticated user visits `/#/transactions` → enters credentials on Sign In → restored directly to `#/transactions`. |

---

## 5. Files Touched

1. `client/src/services/routeService.js` (NEW: Centralized hash routing, URL parsing, and history engine)
2. `client/src/components/NotFoundRoute.jsx` (NEW: 404 Route Not Found component)
3. `client/public/404.html` (NEW: GitHub Pages single-page redirect handler)
4. `client/src/App.jsx` (MODIFIED: Synchronized tab state, popstate/hashchange listeners, centralized navigation)
5. `client/src/components/AuthGate.jsx` (MODIFIED: Unauthenticated route caching and post-login restoration)
6. `client/src/pages/Settings.jsx` (MODIFIED: `onSectionChange` modal lifecycle propagation, full sub-modal initializer)
7. `tests/e2e/27_route_persistence_refresh_audit.spec.js` (NEW: 6 automated end-to-end regression tests)
