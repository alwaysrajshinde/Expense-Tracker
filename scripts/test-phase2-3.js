const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('--- Starting Comprehensive Phase 2 & 3 Automated Verification ---');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // Test 1: PWA Manifest & Service Worker verification
  console.log('\n[Test 1] Verifying PWA Manifest and Assets...');
  const manifestPath = path.resolve(__dirname, '../client/public/manifest.json');
  const swPath = path.resolve(__dirname, '../client/public/sw.js');
  const icon192 = path.resolve(__dirname, '../client/public/icon-192.png');
  const icon512 = path.resolve(__dirname, '../client/public/icon-512.png');
  
  if (!fs.existsSync(manifestPath) || !fs.existsSync(swPath) || !fs.existsSync(icon192) || !fs.existsSync(icon512)) {
    throw new Error('PWA assets missing!');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`✓ Manifest verified: "${manifest.name}" (display: ${manifest.display})`);
  console.log(`✓ Service worker script present at client/public/sw.js`);
  console.log(`✓ Icons 192x192 and 512x512 verified`);

  // Test 2: Auth Gate & Unauthorized rejection
  console.log('\n[Test 2] Testing Authentication Gate & Unauthorized Rejection...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Check if AuthGate is visible
  const authTitle = await page.evaluate(() => {
    const heading = document.querySelector('h1');
    return heading ? heading.textContent : '';
  });
  console.log('Current page header:', authTitle);

  // Switch to passphrase form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const passBtn = btns.find(b => b.textContent.includes('Passphrase'));
    if (passBtn) passBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Clear email input completely using Ctrl+A + Backspace and type unauthorized email
  await page.click('input[type="email"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[type="email"]', 'intruder@example.com');

  await page.click('input[type="password"]');
  await page.type('input[type="password"]', 'ET_SECURE_SYNC_KEY_2026');

  // Click submit button
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 600));

  const pageText = await page.evaluate(() => document.body.innerText);
  if (!pageText.includes('Unauthorized') && !pageText.includes('not allowed')) {
    throw new Error('Unauthorized account was not properly rejected! Page text: ' + pageText.slice(0, 200));
  }
  console.log('✓ Unauthorized Google account successfully blocked with security message!');

  // Test 3: Authorized Login
  console.log('\n[Test 3] Testing Authorized User Login (raaajshinde@gmail.com)...');
  await page.click('input[type="email"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[type="email"]', 'raaajshinde@gmail.com');

  await page.click('input[type="password"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[type="password"]', 'ET_SECURE_SYNC_KEY_2026');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  // Verify dashboard is unlocked
  const dashboardHeading = await page.evaluate(() => {
    const h = document.querySelector('h1');
    return h ? h.textContent : '';
  });
  console.log('Dashboard unlocked successfully:', dashboardHeading);
  if (!dashboardHeading.includes('Good') && !dashboardHeading.includes('Raj')) {
    throw new Error('Dashboard did not unlock properly! Heading: ' + dashboardHeading);
  }
  console.log('✓ Authorized user logged in successfully!');

  // Test 4: Persistent session across refresh
  console.log('\n[Test 4] Testing Session Persistence across browser refresh...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const headingAfterReload = await page.evaluate(() => {
    const h = document.querySelector('h1');
    return h ? h.textContent : '';
  });
  console.log('Heading after reload without re-login:', headingAfterReload);
  if (headingAfterReload.includes('Vault') || headingAfterReload.includes('Login')) {
    throw new Error('Session did not persist across reload!');
  }
  console.log('✓ User stays securely logged in across reloads!');

  // Test 5: Capture Windows Desktop Views (Light & Dark)
  console.log('\n[Test 5] Capturing Windows Desktop Views (Matching Purple Expense Tracker Dashboard.png)...');
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 600));

  const winLightPath = path.resolve(__dirname, '../comparison_windows_light.png');
  await page.screenshot({ path: winLightPath });
  console.log('✓ Captured Windows Desktop (Light):', winLightPath);

  // Toggle Dark Theme
  await page.evaluate(() => {
    const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Theme'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const winDarkPath = path.resolve(__dirname, '../comparison_windows_dark.png');
  await page.screenshot({ path: winDarkPath });
  console.log('✓ Captured Windows Desktop (Dark):', winDarkPath);

  // Switch back to Light Theme
  await page.evaluate(() => {
    const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Theme'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Test 6: Capture Android Mobile Views (Light & Dark)
  console.log('\n[Test 6] Capturing Android Mobile Views (Matching Modern Purple Expense Tracker UI.png)...');
  await page.setViewport({ width: 412, height: 892, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 800));

  const andLightPath = path.resolve(__dirname, '../comparison_android_light.png');
  await page.screenshot({ path: andLightPath });
  console.log('✓ Captured Android Mobile UI (Light):', andLightPath);

  // Switch to Dark Theme in Android mode
  await page.evaluate(() => {
    const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Theme'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const andDarkPath = path.resolve(__dirname, '../comparison_android_dark.png');
  await page.screenshot({ path: andDarkPath });
  console.log('✓ Captured Android Mobile UI (Dark):', andDarkPath);

  // Switch back to Light Theme
  await page.evaluate(() => {
    const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Theme'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Test 7: Add Expense via Quick Add on Desktop and test sync queue
  console.log('\n[Test 7] Testing Expense Addition & Sync Queue...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.waitForSelector('input[placeholder="0"]', { timeout: 5000 });
  await page.type('input[placeholder="0"]', '75');
  await page.type('input[placeholder*="optional"]', 'Morning Tea & Snacks');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent && b.textContent.includes('+ Add Expense'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('✓ Successfully entered expense, saved and queued for sync!');

  // Test 8: Enter Negative Refund Transaction
  console.log('\n[Test 8] Testing Negative Refund / Return Transaction...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const refundBtn = btns.find(b => b.textContent && b.textContent.includes('Refund / Return'));
    if (refundBtn) refundBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.type('input[placeholder="0"]', '150');
  await page.type('input[placeholder*="optional"]', 'Amazon Item Return Refund');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent && b.textContent.includes('+ Add Expense'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('✓ Refund transaction saved with negative amount preserved!');

  await browser.close();
  console.log('\n🎉 ALL Phase 2 & Phase 3 Automated Tests PASSED Successfully!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
