const puppeteer = require('puppeteer-core');
const path = require('path');

async function capture() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Home screenshot
  const homePath = path.join(__dirname, '..', 'screenshot_home.png');
  await page.screenshot({ path: homePath });
  console.log('Captured Home:', homePath);

  // 2. Click "+ Add Expense"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Expense'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const addPath = path.join(__dirname, '..', 'screenshot_add_expense.png');
  await page.screenshot({ path: addPath });
  console.log('Captured Add Expense Modal:', addPath);

  // Close modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.querySelector('svg.lucide-x'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Transactions tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const txTab = btns.find(b => b.textContent.includes('Transactions'));
    if (txTab) txTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const txPath = path.join(__dirname, '..', 'screenshot_transactions.png');
  await page.screenshot({ path: txPath });
  console.log('Captured Transactions:', txPath);

  // 4. Reports tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const repTab = btns.find(b => b.textContent.includes('Reports'));
    if (repTab) repTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const repPath = path.join(__dirname, '..', 'screenshot_reports.png');
  await page.screenshot({ path: repPath });
  console.log('Captured Reports:', repPath);

  // 5. Settings tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const setTab = btns.find(b => b.textContent.includes('More'));
    if (setTab) setTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const setPath = path.join(__dirname, '..', 'screenshot_settings.png');
  await page.screenshot({ path: setPath });
  console.log('Captured Settings:', setPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error in capture:', err);
  process.exit(1);
});
