const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });

  // Inject session directly into localStorage
  await page.evaluate(() => {
    const session = {
      email: 'raaajshinde@gmail.com',
      name: 'Raj Shinde',
      picture: null,
      auth_method: 'google',
      session_token: 'valid_session_test',
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    localStorage.setItem('expense_tracker_auth_session', JSON.stringify(session));
    localStorage.setItem('expense_tracker_theme', 'dark');
    document.documentElement.classList.add('dark');
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const darkPath = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/comparison_windows_dark.png';
  await page.screenshot({ path: darkPath });
  console.log('Saved dark mode screenshot:', darkPath);

  // Switch to light theme
  await page.evaluate(() => {
    localStorage.setItem('expense_tracker_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const lightPath = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/comparison_windows_light.png';
  await page.screenshot({ path: lightPath });
  console.log('Saved light mode screenshot:', lightPath);

  // Also capture Android mobile view (width 390, height 844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    localStorage.setItem('expense_tracker_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const androidDarkPath = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/comparison_android_dark.png';
  await page.screenshot({ path: androidDarkPath });
  console.log('Saved Android dark screenshot:', androidDarkPath);

  await page.evaluate(() => {
    localStorage.setItem('expense_tracker_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const androidLightPath = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/comparison_android_light.png';
  await page.screenshot({ path: androidLightPath });
  console.log('Saved Android light screenshot:', androidLightPath);

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
