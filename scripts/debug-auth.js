const puppeteer = require('puppeteer-core');

async function debugAuth() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001');
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const passBtn = btns.find(b => b.textContent.includes('Passphrase'));
    if (passBtn) passBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Clear email input completely
  await page.click('input[type="email"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[type="email"]', 'intruder@example.com');

  await page.click('input[type="password"]');
  await page.type('input[type="password"]', 'ET_SECURE_SYNC_KEY_2026');

  const valsBefore = await page.evaluate(() => {
    const em = document.querySelector('input[type="email"]');
    const pw = document.querySelector('input[type="password"]');
    return { emailVal: em ? em.value : null, pwVal: pw ? pw.value : null };
  });
  console.log('Values before submit:', valsBefore);

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 800));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER SUBMIT:\n', text);

  await browser.close();
}

debugAuth().catch(console.error);
