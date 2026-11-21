# Personal Expense Tracker – Production Setup & Deployment Guide

This guide provides end-to-end instructions for deploying the Personal Expense Tracker on **GitHub Pages**, configuring **Multi-User Google Authentication**, provisioning **Individual Google Sheets** in each user's Google Drive, and installing the **Progressive Web App (PWA)** on Android.

---

## 1. Hosting on GitHub Pages (100% Free)

The application frontend is built with React, Vite, and Tailwind CSS, and is designed to run entirely as a static web application on GitHub Pages.

### Automatic Deployment via GitHub Actions
A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Phase 4: Multi-User with Individual Google Sheets"
   git branch -M main
   git remote add origin https://github.com/alwaysrajshinde/Expense-Tracker.git
   git push -u origin main
   ```
2. **Enable GitHub Pages:**
   - In your GitHub repository, go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. **Automated Build & Live URL:**
   - Every push to the `main` branch automatically triggers the workflow.
   - Within 1–2 minutes, your application is live at `https://alwaysrajshinde.github.io/Expense-Tracker/`.

---

## 2. Multi-User Google OAuth 2.0 & Consent Screen Setup

To allow any user to sign in and provision their own Google Sheet:

### Step 1: Create OAuth Client in Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `Personal Expense Tracker`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External** (allows any Google account to sign in).
   - App name: `My Expense Tracker`
   - User support email: Select your email
   - Developer contact email: Enter your email
   - Click **Save and Continue**.
4. **Configure OAuth Scopes (Least Privilege):**
   - Click **Add or Remove Scopes**.
   - Select:
     - `.../auth/userinfo.email` (view user email)
     - `.../auth/userinfo.profile` (view user name and picture)
     - `https://www.googleapis.com/auth/drive.file` (**Important**: Least privilege scope. Only grants access to spreadsheets created by or opened with this app. It *never* grants access to the user's entire Google Drive).
   - Click **Save and Continue**.
5. **Publishing Status / Test Users:**
   - While in *Testing* status: You can add specific test accounts under **Test users** (e.g., `raaajshinde@gmail.com`, `user2@gmail.com`, etc.).
   - To open to anyone without pre-registering email addresses in Google Cloud: Click **Publish App**. Google will allow users to sign in (an "unverified app" screen may appear until Google verification is completed, which users can bypass by clicking "Advanced > Go to My Expense Tracker").
6. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Expense Tracker Web Client`.
   - **Authorized JavaScript origins:**
     - `http://localhost:3001` (local backend)
     - `http://localhost:5173` (local Vite dev)
     - `https://<your-username>.github.io` (your GitHub Pages site)
   - Click **Create**.
7. Copy the generated **Client ID** (e.g., `123456789-abcdef.apps.googleusercontent.com`).
8. Paste it directly in the app:
   - On the login screen, click **Google Client ID** and paste it.
   - OR in **Settings** > **Sheets Sync** > **Google OAuth 2.0 Web Client ID**.

---

## 3. Individual Google Sheet Provisioning & Migration

### For Existing User (Raj Shinde - `raaajshinde@gmail.com`):
- All 1,198+ historical transactions are **permanently preserved**.
- The existing spreadsheet ID (`1x-master-raj-expenses-sheet-2026`) is automatically mapped to `user_id = 1`.
- Historical categories (67 categories), payment modes, and the ₹12,000 monthly budget are retained with 0 data loss.
- No blank spreadsheet is ever created for this account.

### For New Users:
- When a new user logs in for the first time:
  1. The app verifies their Google identity.
  2. The backend checks `user_spreadsheet_mappings`.
  3. A new Google Spreadsheet is provisioned in their Google Drive named `My Expense Tracker - [Email]`.
  4. The spreadsheet is initialized with the master 4-sheet template:
     - `Expenses`: 0 transactions, frozen purple header.
     - `Dashboard`: Monthly budget initialized to ₹12,000, summary formulas.
     - `Categories`: Standard 67 categories with icons and color tags.
     - `Payment_Modes`: UPI, Cash, Credit Card, Debit Card, Net Banking.
  5. The new spreadsheet ID is linked to the user.
  6. The user lands on an empty dashboard showing ₹0 spent and ₹12,000 budget remaining.
  7. Subsequent logins load the existing spreadsheet without creating duplicates.

---

## 4. Google Sheets Synchronization (Google Apps Script)

Follow [google-apps-script/README.md](file:///d:/Expense%20Tracker/google-apps-script/README.md) for full deployment details.

- Backend: Multi-User Google Apps Script (`Code.gs`)
- API: Two-way sync reconciles offline changes and direct spreadsheet modifications.
- Conflict Handling: Timestamps (`updated_at`) and unique `Transaction_ID`s ensure rows are updated without duplication.

---

## 5. Installing as a PWA on Android Phone

The application is an installable Progressive Web App (PWA):

1. Open your GitHub Pages URL in **Google Chrome** on your Android smartphone.
2. Log in using your Google account.
3. Tap the Chrome three-dot menu (**⋮**) in the top right corner.
4. Tap **Add to Home screen** or **Install app**.
5. Tap **Install**.
6. The app opens in standalone mode without any browser navigation bars!

---

## 6. Offline Mode & Queue Recovery

- If internet connectivity is lost, transactions are enqueued locally in `expense_tracker_sync_queue`.
- The UI displays an **Offline (X pending)** sync indicator.
- When internet connectivity returns, the queue is automatically flushed to the user's specific Google Sheet.
