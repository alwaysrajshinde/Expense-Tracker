const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function renderIcons() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const svgPath = path.resolve(__dirname, '../client/public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Render 512x512
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`);
  const icon512Path = path.resolve(__dirname, '../client/public/icon-512.png');
  await page.screenshot({ path: icon512Path, omitBackground: true });
  console.log('Generated icon-512.png');

  // Render 192x192
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><div style="width:192px;height:192px;">${svgContent.replace('width="512" height="512"', 'width="192" height="192"')}</div></body></html>`);
  const icon192Path = path.resolve(__dirname, '../client/public/icon-192.png');
  await page.screenshot({ path: icon192Path, omitBackground: true });
  console.log('Generated icon-192.png');

  await browser.close();
  console.log('Icons generation completed!');
}

renderIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
