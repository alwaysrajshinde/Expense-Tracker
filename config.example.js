/**
 * Example Configuration for Personal Expense Tracker
 * Copy this file or configure these values inside the in-app Settings > Google Sheets Sync tab.
 * 
 * NEVER commit your real secrets to a public Git repository.
 */

window.APP_CONFIG = {
  // 1. Google OAuth 2.0 Web Client ID (Created in Google Cloud Console)
  // Used for "Continue with Google" Single Sign-On
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

  // 2. The ONLY Google Email Address permitted to access this application
  AUTHORIZED_EMAIL: "raaajshinde@gmail.com",

  // 3. Google Apps Script Web App Deployment URL
  // Obtained after deploying Code.gs in Google Sheets (Extensions > Apps Script > Deploy > New Deployment)
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx.../exec",

  // 4. Secure Passphrase / Secret Key for two-way synchronization
  // Must match the AUTH_SECRET in your Google Apps Script Code.gs
  AUTH_SECRET: "YOUR_CUSTOM_SECRET_PASSPHRASE_2026",

  // 5. Default Monthly Target Budget in INR (₹)
  DEFAULT_BUDGET: 12000,

  // 6. Currency Symbol
  CURRENCY: "₹"
};
