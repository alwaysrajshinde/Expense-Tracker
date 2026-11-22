# Offline Capability & Security Audit Report — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Security Analyst  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Test Suite:** Playwright Offline & Security Audit (`18_offline_security_audit.spec.js`)  
**Date:** November 2026  

---

## 1. Executive Summary
This report audits the security posture, authentication boundaries, user-specific data isolation, offline resilience, and UI containment of the Personal Expense Tracker application.

---

## 2. Security Assessment Matrix

| Security Domain | Risk Evaluated | Control / Implementation | Audit Result | Severity |
|---|---|---|---|---|
| **Route Protection** | Unauthenticated access to private financial data | React Router Route Guards + AuthContext redirection to `/login` | **PASSED**: Immediate redirect on unauthenticated URL navigation | High |
| **Multi-Tenant Isolation** | User A inspecting or mutating User B's transactions | Firestore user collection scoping (`users/{userId}/transactions`) + local SQLite ownership checks | **PASSED**: Complete query partition; zero cross-tenant data leakage | Critical |
| **Input Sanitization (XSS)** | Malicious script payload injected via description/note | React DOM automatic string escaping + sanitization before persistence | **PASSED**: `<script>window.XSS_DETECTED=true;</script>` rendered safely as plain text; 0 execution | High |
| **SQL Injection (SQLi)** | Database extraction via raw inputs | Parametrized queries in SQLite backend (`?` placeholders) | **PASSED**: Injection payloads treated strictly as string literals | High |
| **Session Invalidation** | Zombie tokens or persistent session after logout | `clearSession()` flushes `localStorage`, `sessionStorage`, and memory | **PASSED**: Complete cache clearance upon logout | Medium |
| **UI Toast Flooding** | Multiple stacked popups obscuring interaction | `ToastContext.jsx` enforces single active pill toast (`setToasts([{ id, msg }])`) | **PASSED**: Zero stacking; new toast replaces prior; auto-dismiss in 2.5s | Medium |

---

## 3. Offline & Service Worker Resilience

### A. PWA Static Asset Caching
- **Implementation:** `public/sw.js` registers a service worker intercepting static asset requests (Vite JS bundles, CSS, Google Fonts, Lucide icons).
- **Audit:** Network was set to offline mode in browser devtools. Page reload was initiated.
- **Result:** The application shell loaded instantly from the Service Worker Cache Storage without throwing connection errors.

### B. Offline Data Persistence & Synchronisation
- **Implementation:** Cloud Firestore offline persistence is enabled (`enableIndexedDbPersistence`). When offline, transaction writes are committed to the local IndexedDB queue.
- **Sync Behavior:** Upon network restoration, queued write batches are dispatched to Firestore serverless collections.
- **Audit:** Transactions created while offline persisted across page reloads and synchronized without collision once internet was restored.

---

## 4. Conclusion & Security Sign-Off
The application demonstrates strong security fundamentals: private routes are guarded, inputs are sanitized against XSS, data is strictly isolated per tenant, and offline capabilities function reliably.
