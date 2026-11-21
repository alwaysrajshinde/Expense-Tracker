# 05. Data Synchronization and Offline Scenarios

**Document Reference:** `UJ-DOC-05`  
**Classification:** Cloud Synchronization, Distributed Concurrency & Offline Resilience  
**Product Version:** 1.0.0 (Production Multi-Tenant Edition)  
**Target Audience:** Cloud Architects, Distributed Systems Engineers, Frontend Developers, QA Testers  

---

## 1. Cloud Synchronization Architecture

The Expense Tracker employs a hybrid cloud architecture combining **Firebase Cloud Firestore** as the central real-time distributed database with **local IndexedDB persistence** and **Service Worker background caching**.

```
  ┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
  │     ANDROID MOBILE (PWA)        │                 │     WINDOWS DESKTOP WORKSPACE   │
  │  IndexedDB Offline Cache        │                 │  Chrome / Edge / Firefox        │
  └────────────────┬────────────────┘                 └────────────────┬────────────────┘
                   │                                                   │
                   │ HTTPS / WebSocket (Firestore SDK)                 │ HTTPS / WebSocket
                   ▼                                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                           FIREBASE CLOUD FIRESTORE                                  │
  │                                                                                     │
  │   /users/{uid}                      (Profile, Settings, Target Budget)              │
  │   /users/{uid}/transactions/{txId}  (Detailed Transaction Records)                  │
  │   /users/{uid}/months/{monthKey}    (Aggregated Roll-Up Cache: Total, Cats, Modes)  │
  │   /users/{uid}/categories/{catId}   (Custom User Taxonomy)                          │
  └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                             │ Background Sync (When Configured)
                                             ▼
                              ┌──────────────────────────────┐
                              │     GOOGLE DRIVE & SHEETS    │
                              │ Personal Ledger Spreadsheet  │
                              └──────────────────────────────┘
```

---

## 2. Synchronization Scenarios Matrix

### Scenario 5.1: Cross-Device Concurrency – Expense Added on Android Appears on Desktop
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-01` |
| **Scenario Name** | Mobile-to-Desktop Transaction Propagation |
| **User Type** | Cross-Device User |
| **Preconditions** | User is logged into the same account on Android phone and Windows desktop simultaneously. |
| **User Action** | Logs an expense of `₹350` (`Groceries`) via Android PWA. Desktop app is open in background on another screen. |
| **Expected Screen** | Android app displays success toast. When user switches to Windows desktop and triggers a tab change, refresh, or receives Firestore snapshot, the desktop Dashboard immediately displays `Total Spent + ₹350` and the new transaction appears in recent activity. |
| **System Behaviour** | Android writes document to `/users/{uid}/transactions/{id}` and updates `/users/{uid}/months/{monthKey}`. In Firestore real-time listener mode or upon active tab re-focus, desktop client queries the month roll-up cache and updates UI state within 500ms. |
| **Expected Result** | Flawless multi-device consistency without manual file transfers. |
| **Error Handling** | If desktop has poor WiFi, it refreshes automatically upon reconnection. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` (Test G3) |

---

### Scenario 5.2: Cross-Device Expense Edit Propagation
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-02` |
| **Scenario Name** | Distributed Transaction Modification |
| **User Type** | Cross-Device User |
| **Preconditions** | Expense `TX-101` recorded as `₹500` under `Shopping`. |
| **User Action** | On Windows desktop, user edits `TX-101` to `₹400` under `Food`. User then looks at their Android mobile app. |
| **Expected Screen** | Android app reflects the updated amount `₹400` and category `Food`. Total monthly spending decreases by `₹100` on both devices. |
| **System Behaviour** | Desktop calls `api.updateExpense(id, data)`. Firestore updates document `TX-101` and adjusts monthly category aggregates ($\text{Shopping} - 500$, $\text{Food} + 400$). Android client synchronizes new values. |
| **Expected Result** | Perfect state synchronization without orphaned discrepancies. |
| **Error Handling** | If both devices attempt to edit the transaction at the exact same millisecond, Firestore's document-level atomic write guarantees serialized commit (Last-Write-Wins). |
| **Status** | **Implemented** |

---

### Scenario 5.3: Cross-Device Transaction Deletion
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-03` |
| **Scenario Name** | Remote Deletion Reflection |
| **User Type** | Cross-Device User |
| **Preconditions** | User has app open on both phone and laptop. |
| **User Action** | Deletes an expense on phone. |
| **Expected Screen** | The deleted row vanishes from the phone ledger. On desktop, upon next navigation or ledger poll, the row is absent and monthly spending reflects the reduction. |
| **System Behaviour** | `deleteDoc(doc(db, 'users', uid, 'transactions', id))` removes record. Month cache decrements total spent. |
| **Expected Result** | No ghost or zombie transactions reappear on either device. |
| **Error Handling** | If desktop attempts to edit the deleted record before refreshing, system handles the missing document error gracefully: *"Transaction no longer exists"*. |
| **Status** | **Implemented** |

---

### Scenario 5.4: Offline Logging During Commute / Flight (No Internet)
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-04` |
| **Scenario Name** | Zero-Connectivity Offline Expense Capture |
| **User Type** | Active / Commuter User |
| **Preconditions** | User is in airplane mode or in an underground subway with zero mobile signal. |
| **User Action** | Opens Expense Tracker PWA. Adds an expense: `₹120` for `Metro ticket`. Clicks Save. |
| **Expected Screen** | Form accepts input. Toast appears: *"Expense recorded locally (Offline mode)"*. Dashboard total spent updates optimistically in client state. Offline status indicator appears in header: `Offline Mode (Sync Pending)`. |
| **System Behaviour** | PWA Service Worker handles application assets. Firestore client SDK (with `enableIndexedDbPersistence`) writes transaction to local IndexedDB storage and queues write mutation for cloud dispatch. |
| **Expected Result** | User can continue logging uninterrupted regardless of network conditions. |
| **Error Handling** | User is prevented from initiating cloud backup downloads while completely offline. |
| **Status** | **Implemented (PWA Service Worker + IndexedDB Client)** |
| **Related Test** | `tests/e2e/08_ui_responsive.spec.js` |

---

### Scenario 5.5: Automatic Network Reconnection & Cloud Sync
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-05` |
| **Scenario Name** | Automatic Background Sync Upon Signal Restoration |
| **User Type** | Returning User |
| **Preconditions** | User logged 3 transactions while offline. Now exits subway and reconnects to 5G / WiFi. |
| **User Action** | Reconnects to network (no manual action needed). |
| **Expected Screen** | Offline status badge in header smoothly transitions to green: `All Changes Synced`. A subtle toast confirms: *"3 offline transactions synced with cloud vault"*. |
| **System Behaviour** | Browser dispatches `window.addEventListener('online')`. Firestore SDK flushes local write buffer to Cloud Firestore servers. Server timestamps are resolved. Month roll-up document is reconciled on cloud. |
| **Expected Result** | 100% data recovery without duplicate record generation or data loss. |
| **Error Handling** | If network blips intermittently, queue retry logic utilizes exponential backoff. |
| **Status** | **Implemented** |

---

### Scenario 5.6: Google Sheets Automated Cloud Synchronization
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-06` |
| **Scenario Name** | Two-Way Ledger Synchronization to User's Personal Google Drive |
| **User Type** | Google OAuth User |
| **Preconditions** | User logged in with Google and granted Google Drive / Sheets permissions. |
| **User Action** | Adds an expense `₹850` in the application. |
| **Expected Screen** | Green toast appears: *"Expense saved and synced to Google Sheets!"*. In Settings > Data, Google Sheet status displays: *"Linked: Expense Tracker Ledger (Google Drive)"* with direct clickable link. |
| **System Behaviour** | App calls `appendExpenseToGoogleSheet(accessToken, spreadsheetId, expense)`. Appends a new formatted row in the user's personal Google Sheet: `[Date, Category, Description, Amount, Payment Mode]`. |
| **Expected Result** | User possesses an external, real-time unencrypted copy of their financial ledger residing in their personal Google Drive account. |
| **Error Handling** | If Google OAuth token expires, app continues saving to Firestore and marks Google Sheet sync as "Paused (Re-authentication required in Settings)". |
| **Status** | **Implemented (`googleDriveService.js`)** |

---

### Scenario 5.7: User Logs Out and Logs In as Different User on Same Device
| Field | Specification |
|---|---|
| **Scenario ID** | `UJ-05-07` |
| **Scenario Name** | Shared Device Cache Isolation & Session Cleansing |
| **User Type** | Shared Device Users |
| **Preconditions** | User A (`alice@example.com`) logs out. User B (`bob@example.com`) logs in on the same browser. |
| **User Action** | User B signs in. |
| **Expected Screen** | User B's dashboard loads showing ONLY User B's categories, expenses, and budget. Zero remnants of User A's data are visible. |
| **System Behaviour** | `signOut()` purges in-memory caches and localStorage session. Firestore queries are scoped strictly to User B's UID: `where('user_id', '==', userB_uid)`. Local storage keys use UID prefixes. |
| **Expected Result** | Absolute privacy and data separation on shared family or office computers. |
| **Error Handling** | Firestore Security Rules reject any read or write where `request.auth.uid != resource.data.user_id`. |
| **Status** | **Implemented** |
| **Related Test** | `tests/e2e/07_data_integrity.spec.js` (Test G3) |

---

## 3. Distributed Concurrency & Conflict Resolution Strategy

| Conflict Type | Resolution Strategy | System Behavior |
| :--- | :--- | :--- |
| **Simultaneous Edit on Same Expense** | Last-Write-Wins (LWW) | Firestore document commit timestamp determines final state; last writer persists. |
| **Delete vs Edit Race Condition** | Delete Precedence | If Device A deletes an expense while Device B submits an edit, the document is removed and Device B receives an informative notification. |
| **Simultaneous Offline Additions** | Client UUID Generation | Every expense is assigned a cryptographically unique UUID (`crypto.randomUUID()`) at creation time, preventing ID collisions when multiple offline devices reconnect. |
| **Monthly Budget Conflict** | Profile Document Serialization | Target budget updates write to `/users/{uid}` via Firestore transaction, ensuring consistent state. |
