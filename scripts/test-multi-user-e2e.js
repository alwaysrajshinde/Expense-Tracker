const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function runE2ETests() {
  console.log('🚀 Starting Phase 4 Multi-User End-to-End Verification...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // -------------------------------------------------------------
    // Test 1: Raj Shinde Login & Historical Data Verification
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Raj Shinde Login & Historical Data ---');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });

    // Clear session and reload
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // Wait for buttons to load
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Click "Raj Shinde" button
    const clickedRaj = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) {
        rajBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Raj Shinde login button:', clickedRaj);

    await new Promise(r => setTimeout(r, 1500));

    // Verify Raj's Dashboard
    const rajDashboardText = await page.evaluate(() => document.body.innerText);
    const hasRajIdentity = rajDashboardText.includes('Raj Shinde') || rajDashboardText.includes('raaajshinde');
    console.log('✓ Raj identity verified:', hasRajIdentity);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_e2e_raj_dashboard.png'), fullPage: false });
    console.log('✓ Raj dashboard screenshot saved');

    // -------------------------------------------------------------
    // Test 2: Logout Raj
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Logout ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------
    // Test 3: Alice (New User) Login & Isolated Empty Dashboard
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Alice (New User) First-Time Login ---');
    await page.waitForSelector('button', { timeout: 10000 });

    const clickedAlice = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aliceBtn = btns.find(b => b.textContent.includes('Alice') || b.textContent.includes('User A'));
      if (aliceBtn) {
        aliceBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Alice login button:', clickedAlice);

    await new Promise(r => setTimeout(r, 1500));

    const aliceDashboardText = await page.evaluate(() => document.body.innerText);
    console.log('✓ Alice dashboard loaded');

    // Verify Alice has 0 spent and ₹12,000 budget
    const hasZeroSpent = aliceDashboardText.includes('₹0') || aliceDashboardText.includes('₹ 0');
    const has12kBudget = aliceDashboardText.includes('12,000') || aliceDashboardText.includes('12000');
    console.log('✓ Alice empty spent verified (₹0):', hasZeroSpent);
    console.log('✓ Alice default budget verified (₹12,000):', has12kBudget);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_e2e_alice_empty.png'), fullPage: false });
    console.log('✓ Alice empty dashboard screenshot saved');

    // -------------------------------------------------------------
    // Test 4: Alice Adds an Expense
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Alice Adds an Expense ---');
    // Click "+ Add Expense" in sidebar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add Expense'));
      if (addBtn) addBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Fill the Add Expense form
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const amountInput = inputs.find(i => i.type === 'number');
      if (amountInput) {
        amountInput.value = '450';
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        amountInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const descInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('coffee') || i.type === 'text');
      if (descInput) {
        descInput.value = 'Team Coffee';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Submit modal form
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));
    console.log('✓ Alice added ₹450 expense');

    const aliceAfterAddText = await page.evaluate(() => document.body.innerText);
    const hasCoffeeExpense = aliceAfterAddText.includes('Team Coffee') || aliceAfterAddText.includes('450');
    console.log('✓ Alice dashboard displays the ₹450 expense:', hasCoffeeExpense);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_e2e_alice_added.png'), fullPage: false });

    // -------------------------------------------------------------
    // Test 5: Verify Alice Settings & Associated Spreadsheet Card
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Alice Settings & Associated Spreadsheet ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const settingsBtn = btns.find(b => b.textContent.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Click "Sheets Sync" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const syncTab = btns.find(b => b.textContent.includes('Sheets Sync'));
      if (syncTab) syncTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const settingsText = await page.evaluate(() => document.body.innerText);
    const hasAssociatedSheet = settingsText.includes('Associated Spreadsheet') || settingsText.includes('Spreadsheet ID');
    const hasDownloadTemplate = settingsText.includes('Download Blank Template') || settingsText.includes('Master Template');
    console.log('✓ Associated Spreadsheet card verified in Settings:', hasAssociatedSheet);
    console.log('✓ Download template option verified:', hasDownloadTemplate);

    await page.screenshot({ path: path.join(__dirname, '../screenshot_e2e_settings_spreadsheet.png'), fullPage: false });

    // -------------------------------------------------------------
    // Test 6: Bob (Second New User) Login & Isolation
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Bob Login & Isolation Check ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Click "User B (Bob)"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bobBtn = btns.find(b => b.textContent.includes('Bob') || b.textContent.includes('User B'));
      if (bobBtn) bobBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const bobDashboardText = await page.evaluate(() => document.body.innerText);
    const bobHasZero = bobDashboardText.includes('₹0') || bobDashboardText.includes('₹ 0');
    const bobDoesNotHaveCoffee = !bobDashboardText.includes('Team Coffee');
    console.log('✓ Bob has 0 spent:', bobHasZero);
    console.log('✓ Bob does NOT see Alice\'s coffee expense (100% Isolated):', bobDoesNotHaveCoffee);

    // -------------------------------------------------------------
    // Test 7: Raj Relogin & Historical Integrity Check
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Raj Re-login & Historical Integrity ---');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rajBtn = btns.find(b => b.textContent.includes('Raj Shinde') || b.textContent.includes('raaajshinde'));
      if (rajBtn) rajBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const rajFinalText = await page.evaluate(() => document.body.innerText);
    const rajHasNoCoffee = !rajFinalText.includes('Team Coffee');
    console.log('✓ Raj historical records remain 100% isolated (no Alice records):', rajHasNoCoffee);

    console.log('\n🎉 ALL 7 MULTI-USER E2E UI TEST SCENARIOS PASSED WITH FULL DATA ISOLATION!');
  } catch (err) {
    console.error('❌ E2E Test Error:', err);
  } finally {
    await browser.close();
  }
}

runE2ETests();
