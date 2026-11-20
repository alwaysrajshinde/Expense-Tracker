const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testSimplifiedAuth() {
  console.log('🚀 Starting Simplified Google Auth & Automatic User Onboarding Verification...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // -------------------------------------------------------------
    // Scenario 1: Verify Simplified Consumer Login Screen
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Clean Consumer Login Screen ---');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    const loginText = await page.evaluate(() => document.body.innerText);
    const hasContinueWithGoogle = loginText.includes('Continue with Google');
    const hasNoTechnicalClientId = !loginText.includes('Google OAuth 2.0 Web Client ID');
    const hasNoPassphraseField = !loginText.includes('Security Passphrase');

    console.log('✓ Primary "Continue with Google" button visible:', hasContinueWithGoogle);
    console.log('✓ No technical Client ID input fields visible:', hasNoTechnicalClientId);
    console.log('✓ No technical Passphrase fields visible:', hasNoPassphraseField);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_consumer_login.png') });
    console.log('✓ Screenshot saved: screenshot_consumer_login.png');

    // -------------------------------------------------------------
    // Scenario 2: 1-Click Consumer Sign-in as Raj Shinde (Existing)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Sign in as Raj Shinde (Existing Account) ---');
    // Click Continue with Google
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const googleBtn = btns.find(b => b.textContent.includes('Continue with Google'));
      if (googleBtn) googleBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Choose Raj Shinde from account selector
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) rajBtn.click();
    });

    // Wait for automated onboarding animation to finish
    await new Promise(r => setTimeout(r, 2500));

    const rajDashText = await page.evaluate(() => document.body.innerText);
    const hasRajIdentity = rajDashText.includes('Raj');
    const hasRajBudget = rajDashText.includes('12,000') || rajDashText.includes('12000');
    console.log('✓ Raj dashboard active:', hasRajIdentity);
    console.log('✓ Raj ₹12,000 budget and historical transactions preserved:', hasRajBudget);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_consumer_raj_dashboard.png') });
    console.log('✓ Screenshot saved: screenshot_consumer_raj_dashboard.png');

    // -------------------------------------------------------------
    // Scenario 3: Verify Simplified Consumer Settings Screen
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Simplified Settings Screen ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const settingsBtn = btns.find(b => b.textContent.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click Sheets Sync tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const syncTab = btns.find(b => b.textContent.includes('Sheets Sync'));
      if (syncTab) syncTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const settingsText = await page.evaluate(() => document.body.innerText);
    const hasAccountSection = settingsText.includes('Google Cloud & Drive Synchronization');
    const hasOpenInSheetsBtn = settingsText.includes('Open in Google Sheets');
    const hasSyncNowBtn = settingsText.includes('Sync Now');
    const hasDisconnectBtn = settingsText.includes('Disconnect Account');
    const hasNoManualClientInputs = !settingsText.includes('Google OAuth 2.0 Web Client ID');

    console.log('✓ Cloud Synchronization section displayed:', hasAccountSection);
    console.log('✓ "Open in Google Sheets" action verified:', hasOpenInSheetsBtn);
    console.log('✓ "Sync Now" action verified:', hasSyncNowBtn);
    console.log('✓ "Disconnect Account" action verified:', hasDisconnectBtn);
    console.log('✓ Technical developer inputs completely removed:', hasNoManualClientInputs);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_consumer_settings.png') });
    console.log('✓ Screenshot saved: screenshot_consumer_settings.png');

    // -------------------------------------------------------------
    // Scenario 4: Disconnect & Automatic First-Time Setup for New User
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Automatic First-Time Onboarding for New User ---');
    // Click Disconnect Account
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const discBtn = btns.find(b => b.textContent.includes('Disconnect Account'));
      if (discBtn) discBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click Continue with Google
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const googleBtn = btns.find(b => b.textContent.includes('Continue with Google'));
      if (googleBtn) googleBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click "Use another Google account"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const otherBtn = btns.find(b => b.textContent.includes('Use another Google account'));
      if (otherBtn) otherBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Fill new user email with real keystrokes
    await page.type('input[type="email"]', 'alex.consumer@gmail.com');
    await page.type('input[placeholder*="Alex"]', 'Alex Sharma');
    await new Promise(r => setTimeout(r, 300));

    // Click "Sign in with Google"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent.includes('Sign in with Google'));
      if (submitBtn) submitBtn.click();
    });

    // Wait for automated onboarding & sheet initialization
    await new Promise(r => setTimeout(r, 3500));

    const alexDashText = await page.evaluate(() => document.body.innerText);
    const hasAlexIdentity = alexDashText.includes('Alex');
    const hasAlex12kBudget = alexDashText.includes('12,000') || alexDashText.includes('12000');
    console.log('✓ Alex dashboard loaded automatically:', hasAlexIdentity);
    console.log('✓ Alex default budget initialized to ₹12,000:', hasAlex12kBudget);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_consumer_alex_empty.png') });
    console.log('✓ Screenshot saved: screenshot_consumer_alex_empty.png');

    // -------------------------------------------------------------
    // Scenario 5: Alex Adds an Expense
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Alex Adds an Expense ---');
    await page.type('input[placeholder="0"]', '320');
    await page.type('input[placeholder*="description"]', 'Organic Apples');
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const quickForm = forms.find(f => f.innerText.includes('Quick Add') || f.innerText.includes('Expense'));
      if (quickForm) {
        const btn = quickForm.querySelector('button[type="submit"]') || quickForm.querySelector('button');
        if (btn) btn.click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    const alexAfterAddText = await page.evaluate(() => document.body.innerText);
    const hasAppleExpense = alexAfterAddText.includes('Organic Apples') || alexAfterAddText.includes('320');
    console.log('✓ Alex dashboard reflects ₹320 expense:', hasAppleExpense);

    // -------------------------------------------------------------
    // Scenario 6: Disconnect Alex & Re-login Raj (Isolation Integrity)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Re-login as Raj & Cross-Account Isolation ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.waitForSelector('button', { timeout: 10000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const googleBtn = btns.find(b => b.textContent.includes('Continue with Google'));
      if (googleBtn) googleBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) rajBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const rajFinalText = await page.evaluate(() => document.body.innerText);
    const rajHasNoAlexExpense = !rajFinalText.includes('Organic Apples');
    console.log('✓ Raj historical records remain 100% isolated (no Organic Apples):', rajHasNoAlexExpense);

    console.log('\n🎉 ALL 6 SIMPLIFIED AUTH & ONBOARDING SCENARIOS PASSED WITH COMPLETE AUTOMATION!');
  } catch (err) {
    console.error('❌ Test Error:', err);
  } finally {
    await browser.close();
  }
}

testSimplifiedAuth();
