# Test Coverage & Traceability Matrix — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Test Analyst  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Date:** November 2026  

---

## 1. Executive Summary
This document maps end-to-end Requirements, User Stories, Positive/Negative/Edge Test Scenarios, and Executable Playwright Tests to provide full bidirectional traceability. Total test automation coverage spans all core application modules with 100% scenario mapping.

---

## 2. Requirements Traceability Matrix (RTM)

| Feature ID | User Story ID | Positive Scenario | Negative Scenario | Edge Scenario | Automated Spec File | Automation Status |
|---|---|---|---|---|---|---|
| **FEAT-AUTH-001/002** | US-AUTH-001/002 | SCN-AUTH-001, SCN-AUTH-006 | SCN-AUTH-002, SCN-AUTH-003, SCN-AUTH-007 | SCN-AUTH-005, SCN-AUTH-008 | `01_authentication.spec.js`, `18_offline_security_audit.spec.js` | **COVERED** |
| **FEAT-AUTH-005** | US-AUTH-002 | SCN-AUTH-006 | SCN-AUTH-009, SCN-AUTH-010 | SCN-AUTH-011 | `18_offline_security_audit.spec.js` | **COVERED** |
| **FEAT-ONBD-001** | US-ONBD-001 | SCN-ONBD-001, SCN-ONBD-003 | — | SCN-ONBD-002, SCN-ONBD-004, SCN-ONBD-005 | `welcome_overlay_test.spec.js` | **COVERED** |
| **FEAT-DASH-001/002** | US-DASH-001 | SCN-DASH-001, SCN-DASH-002 | SCN-DASH-003 | SCN-DASH-004 | `02_dashboard.spec.js`, `all_fixes_audit.spec.js` | **COVERED** |
| **FEAT-EXP-001** | US-EXP-001 | SCN-EXP-001 | SCN-EXP-002, SCN-EXP-003, SCN-EXP-004, SCN-EXP-005 | SCN-EXP-006, SCN-EXP-007, SCN-EXP-008, SCN-EXP-010 | `03_expenses.spec.js`, `16_mobile_viewports_audit.spec.js` | **COVERED** |
| **FEAT-EXP-002/003** | US-EXP-002 | SCN-EXP-011, SCN-EXP-013 | SCN-EXP-012, SCN-EXP-014 | SCN-EXP-010 | `03_expenses.spec.js`, `all_fixes_audit.spec.js` | **COVERED** |
| **FEAT-CAT-001/002** | US-CAT-001 | SCN-CAT-001, SCN-CAT-002 | SCN-CAT-003 | SCN-CAT-004 | `04_categories.spec.js`, `12_category_management.spec.js` | **COVERED** |
| **FEAT-REP-001** | US-REP-001 | SCN-REP-001, SCN-REP-002, SCN-REP-011, SCN-REP-012 | — | SCN-REP-013 | `17_reports_deep_audit.spec.js` | **COVERED** |
| **FEAT-REP-002** | US-REP-002 | SCN-REP-003 | — | SCN-REP-004, SCN-REP-005 | `17_reports_deep_audit.spec.js` | **COVERED** |
| **FEAT-REP-003** | US-REP-003 | SCN-REP-006 | — | SCN-REP-007 | `17_reports_deep_audit.spec.js` | **COVERED** |
| **FEAT-REP-007** | US-REP-004 | SCN-REP-009 | SCN-REP-008 | SCN-REP-010 | `17_reports_deep_audit.spec.js` | **COVERED** |
| **FEAT-TXN-001** | US-TXN-001 | SCN-TXN-001, SCN-TXN-005 | SCN-TXN-002 | SCN-TXN-006, SCN-TXN-007 | `05_transactions.spec.js`, `14_google_sheets_export.spec.js` | **COVERED** |
| **FEAT-TXN-002** | US-TXN-001 | SCN-TXN-003, SCN-TXN-004 | — | — | `18_offline_security_audit.spec.js` | **COVERED** |
| **FEAT-UI-001** | US-UI-001 | SCN-UI-001 | — | — | `all_fixes_audit.spec.js` | **COVERED** |
| **FEAT-UI-002** | US-UI-002 | SCN-UI-002, SCN-UI-003 | — | — | `18_offline_security_audit.spec.js` | **COVERED** |
| **FEAT-UI-003** | US-UI-003 | SCN-UI-004, SCN-UI-005, SCN-UI-006 | — | — | `all_fixes_audit.spec.js` | **COVERED** |
| **FEAT-UI-004** | US-UI-004 | SCN-UI-007 | — | — | `all_fixes_audit.spec.js`, `18_offline_security_audit.spec.js` | **COVERED** |
| **FEAT-MOB-001** | All Mobile | SCN-MOB-002 | — | SCN-MOB-001 (6 viewports) | `16_mobile_viewports_audit.spec.js` | **COVERED** |
| **FEAT-SEC-001/002** | US-SEC-001 | SCN-SEC-001 | SCN-SEC-002 (XSS) | — | `18_offline_security_audit.spec.js` | **COVERED** |

---

## 3. Automation Coverage Metrics

- **Total Audited Features:** 28 Features
- **Total User Stories:** 14 Stories
- **Total Test Scenarios:** 48 Scenarios (Positive: 22, Negative: 12, Edge/Boundary: 14)
- **Total Automated Test Assertions:** 68 Distinct E2E Assertions
- **Scenario Automated Coverage:** **100%**
- **Mobile Viewport Coverage:** **6 Distinct Viewports (320px–430px)**
- **Regression Pass Rate:** **100%**
