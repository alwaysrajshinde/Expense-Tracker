# Playwright Automation Architecture & Framework Specification

**Author:** Senior QA Automation Engineer & Playwright Automation Architect  
**Application:** Personal Expense Tracker  
**Framework:** Playwright End-to-End Test Suite  
**Document Version:** 2.4.0-PROD  
**Last Updated:** November 2026  

---

## 1. Architectural Philosophy & Objectives

The Playwright test automation framework for the Personal Expense Tracker is designed around three foundational engineering pillars:
1. **Mobile-First Priority:** Strict multi-viewport validation across 6 distinct mobile widths (320px, 360px, 375px, 390px, 414px, 430px) before desktop regression.
2. **Deterministic & Flake-Free Execution:** Single-worker sequential execution (`workers: 1`) protecting shared database states, explicit awaiting of microtasks, and resilient locator strategies utilizing `aria-label`, test IDs, and semantic roles.
3. **Multi-Engine Compatibility:** Seamless testing across Cloud Firestore (serverless cloud engine), Local SQLite (local backend), and Client-Side Fallback engine.

---

## 2. Directory Structure

```
Expense Tracker/
├── client/                      # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI widgets (CustomDropdown, WelcomeGreetingOverlay, etc.)
│   │   ├── pages/               # Route views (Home, Reports, Transactions, Settings, AddExpense)
│   │   ├── context/             # React Contexts (AuthContext, ToastContext, LanguageContext, ThemeContext)
│   │   └── services/            # APIs (api.js, firestoreService.js, sheetsBackend.js)
├── server/                      # Express + SQLite Backend API
│   ├── index.js                 # API server entry point (port 3001)
│   └── db.js                    # SQLite database schema and connection
├── tests/                       # Playwright Automation Framework Root
│   ├── e2e/                     # Automated Test Specifications
│   │   ├── 01_authentication.spec.js
│   │   ├── 02_dashboard.spec.js
│   │   ├── 03_expenses.spec.js
│   │   ├── 04_categories.spec.js
│   │   ├── 05_transactions.spec.js
│   │   ├── 06_reports.spec.js
│   │   ├── 07_data_integrity.spec.js
│   │   ├── 08_ui_responsive.spec.js
│   │   ├── 10_intelligent_import.spec.js
│   │   ├── 12_category_management.spec.js
│   │   ├── 13_mobile_fixes_and_sync.spec.js
│   │   ├── 14_google_sheets_export.spec.js
│   │   ├── 15_mobile_qa_stabilization.spec.js
│   │   ├── 16_mobile_viewports_audit.spec.js
│   │   ├── 17_reports_deep_audit.spec.js
│   │   ├── 18_offline_security_audit.spec.js
│   │   ├── all_fixes_audit.spec.js
│   │   └── welcome_overlay_test.spec.js
│   ├── fixtures/                # Reusable test fixtures & state injectors
│   │   ├── auth.fixture.js      # Session injection, loginAsRaj() helper
│   │   └── testData.js          # Mock data structures and seed objects
│   └── helpers/                 # Utility functions
│       └── dbHelper.js          # Direct DB querying, reset routines, assertions
├── docs/qa/                     # QA Audit & Test Reporting Artifacts
│   ├── application-feature-inventory.md
│   ├── user-stories-and-acceptance-criteria.md
│   ├── test-scenarios.md
│   ├── test-cases.md
│   ├── test-data.md
│   ├── automation-architecture.md
│   ├── mobile-testing-report.md
│   ├── functional-testing-report.md
│   ├── reports-module-test-report.md
│   ├── offline-and-security-test-report.md
│   ├── desktop-and-cross-browser-report.md
│   ├── final-regression-test-report.md
│   ├── defect-tracker.md
│   └── test-coverage-report.md
└── playwright.config.js         # Playwright Master Configuration
```

---

## 3. Configuration & Multi-Project Strategy

In `playwright.config.js`, projects are defined to emulate mobile environments natively alongside desktop regression:

```javascript
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1, // Deterministic sequential runs to protect test isolation
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Pixel 7'],
        viewport: { width: 393, height: 851 },
        isMobile: true
      }
    },
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    }
  ]
});
```

---

## 4. Test Fixtures & Page Helper Design

### A. Authentication & Session Injection (`auth.fixture.js`)
To avoid redundant login steps in non-auth tests, `loginAsRaj(page)` injects mock authentication tokens into `localStorage` and seeds the test user context directly into the browser session before navigating to the app:

```javascript
export async function loginAsRaj(page) {
  await page.addInitScript(() => {
    localStorage.setItem('expense_tracker_user', JSON.stringify({
      uid: 'raj_shinde_uid',
      email: 'raaajshinde@gmail.com',
      displayName: 'Raj Shinde',
      isVerified: true
    }));
    localStorage.setItem('auth_token', 'mock_jwt_test_token_raj');
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}
```

### B. Resilient Locators Principle
Tests strictly avoid fragile XPath or deeply nested CSS selectors. Instead, they use user-centric locators:
- `page.getByRole('button', { name: /save expense/i })`
- `page.getByLabel('Select Month Filter')`
- `page.locator('#welcome-greeting-overlay')`
- `page.locator('button:has-text("हिन्दी")')`

---

## 5. Execution Commands & Guidelines

| Execution Goal | Playwright Command |
|---|---|
| Run all mobile E2E tests | `npx playwright test --project=chromium-mobile` |
| Run all desktop regression tests | `npx playwright test --project=chromium-desktop` |
| Run Welcome Back Motivation Overlay spec | `npx playwright test tests/e2e/welcome_overlay_test.spec.js --project=chromium-mobile` |
| Run Mobile Viewport Matrix spec | `npx playwright test tests/e2e/16_mobile_viewports_audit.spec.js --project=chromium-mobile` |
| Run Reports Deep Audit spec | `npx playwright test tests/e2e/17_reports_deep_audit.spec.js --project=chromium-mobile` |
| Run Offline & Security spec | `npx playwright test tests/e2e/18_offline_security_audit.spec.js --project=chromium-mobile` |
| View Playwright HTML Report | `npx playwright show-report playwright-report` |

---

## 6. Flakiness Mitigation & Best Practices
1. **Zero Hardcoded Sleeps:** Never use `page.waitForTimeout()` unless strictly verifying time-based auto-dismiss behavior (e.g. 3.8s overlay dismiss). Always wait for web-first assertions (`expect(locator).toBeVisible()`).
2. **Isolation Guarantee:** Clean up test transactions created during test runs using teardown hooks.
3. **Deterministic Sequential Mode:** Single worker mode (`workers: 1`) prevents concurrent database write collisions on local SQLite or cloud collections.
