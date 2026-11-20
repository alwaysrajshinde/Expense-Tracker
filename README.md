# Expense Tracker 💜

A modern, high-performance personal finance and expense tracking application built with **React 19**, **Vite**, **Tailwind CSS v4**, and **SQLite**, featuring seamless **Google Sheets synchronization**, **Progressive Web App (PWA)** mobile support, and **Multi-User data isolation**.

---

## ✨ Features

- 🖥️ **Windows Desktop Experience:** Rich desktop dashboard with interactive metrics, charts, quick transaction entry, filterable data tables, and customizable monthly budgets.
- 📱 **Android & Mobile PWA:** Fully responsive mobile interface installable as a native-like Progressive Web App via Chrome's *Add to Home Screen*.
- 🔐 **Consumer-Friendly Google Authentication:** One-click Google sign-in with automatic account detection and onboarding. No manual OAuth credentials required for end users.
- 📊 **Individual Google Sheets Provisioning:** Each user automatically receives their own dedicated Google Spreadsheet in their personal Google Drive initialized with standard master templates:
  - `Expenses` (transaction log)
  - `Dashboard` (monthly budget & metrics)
  - `Categories` (67 pre-configured categories with icons and color tags)
  - `Payment_Modes` (UPI, Cash, Credit Card, Debit Card, Net Banking)
- 🔒 **Complete Multi-User Isolation:** Strictly isolated records. User A never sees User B's transactions, budget, or reports.
- ⚡ **Offline Resilience & Two-Way Sync:** Offline transaction queuing with automatic two-way background synchronization when network connectivity resumes.
- 🛡️ **Existing Data Preservation:** Guaranteed 100% preservation of Raj Shinde's historical transactions (1,216+ records), 67 categories, and ₹12,000 monthly budget.
- 🚀 **100% Free GitHub Pages Deployment:** Built-in GitHub Actions workflow for zero-configuration static deployment.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alwaysrajshinde/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Start the development servers:**
   ```bash
   # Start backend API (port 3001)
   npm run dev:server

   # In a separate terminal, start client (port 5173)
   npm run dev:client
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173` (or `http://localhost:3001` when serving production build).

---

## 🌐 Deploy to GitHub Pages

The repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/deploy.yml`).

### Step-by-Step GitHub Pages Activation:

1. Push your repository to GitHub on branch `main`.
2. On GitHub, navigate to your repository: **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically trigger, build the frontend with Vite, and deploy your site to:
   ```
   https://alwaysrajshinde.github.io/Expense-Tracker/
   ```

---

## 📱 Installing on Android (PWA)

1. Open your published GitHub Pages URL (or local network IP) in Google Chrome on your Android device.
2. Tap the three dots menu (**⋮**) in Chrome.
3. Tap **Install app** or **Add to Home screen**.
4. The app will install with its custom app icon and run standalone without browser URL bars.

---

## 📁 Project Architecture

```
Expense-Tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages automated deployment workflow
├── client/                     # Frontend Application (React 19 + Vite + Tailwind v4)
│   ├── public/
│   │   ├── manifest.json       # PWA Web App Manifest
│   │   ├── sw.js               # Service Worker for offline caching & sync
│   │   └── icon-*.png          # Application branding & icons
│   ├── src/
│   │   ├── components/         # Reusable UI components (AuthGate, Navbar, Sidebar, etc.)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # Home, AndroidHome, Transactions, Reports, Settings
│   │   └── services/           # api.js, syncService.js, sheetsBackend.js
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API & Database (Express + Better-SQLite3)
│   ├── db.js                   # Database schema, user mappings, & migrations
│   ├── index.js                # Express server setup
│   └── routes.js               # User-scoped REST API endpoints
├── google-apps-script/         # Google Sheets App Script Backend
│   ├── Code.gs                 # Serverless multi-user Google Sheets sync handler
│   └── README.md
├── scripts/                    # Automated testing & migration utilities
├── .gitignore                  # Strict security exclusions (data/*.db, .env, etc.)
├── .env.example                # Example environment variables
└── README.md
```

---

## 🛡️ Security & Privacy

- **No Secrets in Source:** No OAuth client secrets, private keys, or API tokens are checked into git.
- **Protected Database:** The local SQLite database (`data/*.db`) is strictly excluded from version control.
- **Least-Privilege Scopes:** Google Drive integration utilizes the scoped `drive.file` permission, ensuring the application can only access files created by the application itself.

---

## 📄 License

ISC License © Raj Shinde
