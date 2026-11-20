const puppeteer = require('puppeteer-core');

async function debugPage() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('Body HTML length:', html.length);
  console.log('Body HTML preview:', html.slice(0, 300));

  await browser.close();
}

debugPage().catch(console.error);
