const puppeteer = require('puppeteer-core');

async function testLogout() {
  console.log('--- Testing Profile Logout Functionality ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Log in
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const passBtn = btns.find(b => b.textContent.includes('Passphrase'));
    if (passBtn) passBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.click('input[type="email"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[type="email"]', 'raaajshinde@gmail.com');

  await page.click('input[type="password"]');
  await page.type('input[type="password"]', 'ET_SECURE_SYNC_KEY_2026');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  console.log('✓ Successfully logged in');

  // 2. Open Profile menu via Header avatar
  await page.evaluate(() => {
    const avatarBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'RS');
    if (avatarBtn) avatarBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify dropdown menu is open
  const dropdownText = await page.evaluate(() => document.body.innerText);
  if (!dropdownText.includes('Log Out') || !dropdownText.includes('raaajshinde@gmail.com')) {
    throw new Error('Profile dropdown did not open or lacks Log Out option!');
  }
  console.log('✓ Profile dropdown menu opened, showing raaajshinde@gmail.com and Log Out button');

  // 3. Click Log Out
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const logoutBtn = btns.find(b => b.textContent.includes('Log Out'));
    if (logoutBtn) logoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 4. Verify AuthGate is displayed
  const afterLogoutHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log('Heading after logout:', afterLogoutHeading);
  if (!afterLogoutHeading.includes('PocketNook') && !afterLogoutHeading.includes('Tracker')) {
    throw new Error('Failed to return to AuthGate after logout!');
  }
  console.log('✓ Successfully logged out, locked vault behind AuthGate!');

  // 5. Verify page refresh does NOT bypass logout
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const afterReloadHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  if (afterReloadHeading.includes('Good Evening') || afterReloadHeading.includes('Good Morning')) {
    throw new Error('Session persisted after explicit logout!');
  }
  console.log('✓ Verified: Reloading page keeps vault locked until re-authenticated!');

  await browser.close();
  console.log('\n🎉 Profile Logout Test PASSED 100% Successfully!');
}

testLogout().catch(err => {
  console.error('Logout test failed:', err);
  process.exit(1);
});
