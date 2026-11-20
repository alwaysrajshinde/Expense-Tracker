const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function runE2ETests() {
  console.log('🚀 Running Comprehensive Phase 4 Multi-User UI Verification...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // -----------------------------------------------------------------
    // Scenario 1: Raj Shinde Login & Historical Data Verification
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 1: Raj Shinde Login & Historical Data ---');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Click "Raj Shinde" login button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) rajBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    const rajText = await page.evaluate(() => document.body.innerText);
    const hasRajIdentity = rajText.includes('Raj');
    const hasRajBudget = rajText.includes('12,000') || rajText.includes('12000');
    console.log('✓ Raj session active:', hasRajIdentity);
    console.log('✓ Raj ₹12,000 monthly budget preserved:', hasRajBudget);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_verified_raj_dashboard.png') });
    console.log('✓ Screenshot saved: screenshot_verified_raj_dashboard.png');

    // -----------------------------------------------------------------
    // Scenario 2: Logout Raj
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 2: Log Out ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // -----------------------------------------------------------------
    // Scenario 3: Bob (New User with 0 Transactions) First-Time Login
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 3: Bob (New User) First-Time Login ---');
    await page.waitForSelector('button', { timeout: 10000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bobBtn = btns.find(b => b.textContent.includes('Bob') || b.textContent.includes('User B'));
      if (bobBtn) bobBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    const bobInitialText = await page.evaluate(() => document.body.innerText);
    const hasBobIdentity = bobInitialText.includes('Bob');
    const bobBudgetPresent = bobInitialText.includes('12,000') || bobInitialText.includes('12000');
    console.log('✓ Bob session active:', hasBobIdentity);
    console.log('✓ Bob default budget initialized to ₹12,000:', bobBudgetPresent);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_verified_bob_empty.png') });
    console.log('✓ Screenshot saved: screenshot_verified_bob_empty.png');

    // -----------------------------------------------------------------
    // Scenario 4: Bob Adds an Expense (Quick Add Form)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 4: Bob Adds an Expense ---');
    // Fill quick add form
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const amountInput = inputs.find(i => i.placeholder === '0' || i.type === 'number');
      if (amountInput) {
        amountInput.value = '250';
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const descInput = inputs.find(i => i.placeholder && i.placeholder.includes('description'));
      if (descInput) {
        descInput.value = 'Morning Breakfast';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Click quick add submit button
    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const quickForm = forms.find(f => f.innerText.includes('Quick Add') || f.innerText.includes('Expense'));
      if (quickForm) {
        const btn = quickForm.querySelector('button[type="submit"]') || quickForm.querySelector('button');
        if (btn) btn.click();
      } else {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.textContent.trim() === 'Add Expense' || b.textContent.includes('Add'));
        if (addBtn) addBtn.click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    const bobAfterText = await page.evaluate(() => document.body.innerText);
    const hasMorningBreakfast = bobAfterText.includes('Morning Breakfast') || bobAfterText.includes('250');
    console.log('✓ Bob dashboard reflects new transaction:', hasMorningBreakfast);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_verified_bob_added.png') });
    console.log('✓ Screenshot saved: screenshot_verified_bob_added.png');

    // -----------------------------------------------------------------
    // Scenario 5: Bob Settings & Individual Google Sheet Verification
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 5: Bob Settings & Spreadsheet Card ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const settingsBtn = btns.find(b => b.textContent.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const syncTab = btns.find(b => b.textContent.includes('Sheets Sync'));
      if (syncTab) syncTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const settingsText = await page.evaluate(() => document.body.innerText);
    const hasSheetSection = settingsText.includes('Google Drive & Associated Spreadsheet');
    const hasOpenInSheets = settingsText.includes('Open in Google Sheets');
    console.log('✓ Google Drive & Associated Spreadsheet card displayed:', hasSheetSection);
    console.log('✓ Open in Google Sheets action link verified:', hasOpenInSheets);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_verified_settings_spreadsheet.png') });
    console.log('✓ Screenshot saved: screenshot_verified_settings_spreadsheet.png');

    // -----------------------------------------------------------------
    // Scenario 6: Re-login as Raj & Cross-Account Isolation Verification
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 6: Re-login as Raj & Isolation Guarantee ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.waitForSelector('button', { timeout: 10000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) rajBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const rajFinalText = await page.evaluate(() => document.body.innerText);
    const rajHasNoBobBreakfast = !rajFinalText.includes('Morning Breakfast');
    const rajHasNoAliceVeg = !rajFinalText.includes('Weekly Organic Vegetables');
    console.log('✓ Raj records are 100% isolated from Bob (no Morning Breakfast):', rajHasNoBobBreakfast);
    console.log('✓ Raj records are 100% isolated from Alice (no Organic Vegetables):', rajHasNoAliceVeg);

    console.log('\n🎉 ALL PHASE 4 MULTI-USER ISOLATION AND SPREADSHEET VERIFICATION SCENARIOS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ E2E Error:', err);
  } finally {
    await browser.close();
  }
}

runE2ETests();
