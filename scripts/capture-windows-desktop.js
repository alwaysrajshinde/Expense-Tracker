const puppeteer = require('puppeteer-core');
const path = require('path');

async function capture() {
  console.log('Launching Chrome to capture updated web design...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  // Set viewport to 1500 x 920 with dpr 1.5
  await page.setViewport({ width: 1500, height: 920, deviceScaleFactor: 1.5 });

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Light Theme Screenshot (Matching updated web reference)
  const lightPath = path.join(__dirname, '..', 'screenshot_web_updated_light.png');
  await page.screenshot({ path: lightPath });
  console.log('Captured Updated Web Light Dashboard:', lightPath);

  // 2. Switch to Dark Theme
  await page.evaluate(() => {
    // Click theme toggle button in header
    const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Theme'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const darkPath = path.join(__dirname, '..', 'screenshot_web_updated_dark.png');
  await page.screenshot({ path: darkPath });
  console.log('Captured Updated Web Dark Dashboard:', darkPath);

  // 3. Transactions Screen in Dark Theme
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('aside button'));
    const txBtn = btns.find(b => b.textContent.includes('Transactions'));
    if (txBtn) txBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const txPath = path.join(__dirname, '..', 'screenshot_web_updated_transactions.png');
  await page.screenshot({ path: txPath });
  console.log('Captured Updated Web Transactions:', txPath);

  await browser.close();
  console.log('All updated screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
