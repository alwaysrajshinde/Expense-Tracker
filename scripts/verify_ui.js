const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\hi\\.gemini\\antigravity\\brain\\6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1000);

  // 1. Screenshot Sign In
  const signinPath = path.join(ARTIFACT_DIR, 'screenshot_universal_signin.png');
  await page.screenshot({ path: signinPath, fullPage: true });
  console.log('Saved Sign In screenshot:', signinPath);

  // 2. Click Create Account
  await page.locator('button:has-text("Create Account")').first().click();
  await page.waitForTimeout(500);

  // 3. Screenshot Create Account
  const signupPath = path.join(ARTIFACT_DIR, 'screenshot_universal_signup.png');
  await page.screenshot({ path: signupPath, fullPage: true });
  console.log('Saved Create Account screenshot:', signupPath);

  await browser.close();
  console.log('UI Verification screenshots complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
