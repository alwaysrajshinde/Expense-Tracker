// @ts-check
const { test } = require('../fixtures/auth.fixture');
const path = require('path');

test('Capture Screenshots for Language & Welcome Back Overlay', async ({ page, authHelpers }) => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';
  await page.setViewportSize({ width: 393, height: 851 });

  // 1. Login
  await authHelpers.loginAsRaj();
  await page.waitForTimeout(600);

  // 2. Switch Language to Marathi in Settings
  const moreTab = page.locator('nav button').filter({ hasText: /More|अधिक/i }).first();
  await moreTab.click();
  await page.waitForTimeout(500);

  const langBtn = page.locator('button').filter({ hasText: /Language|भाषा/i }).first();
  await langBtn.click();
  await page.waitForTimeout(400);

  const mrOption = page.locator('button').filter({ hasText: /मराठी/i }).first();
  await mrOption.click();
  await page.waitForTimeout(600);

  // Take screenshot of Settings in Marathi
  await page.screenshot({ path: path.join(artifactDir, 'verify_marathi_settings.png'), fullPage: false });

  // 3. Navigate back to Home in Marathi
  const homeTab = page.locator('nav button').filter({ hasText: /होम/i }).first();
  await homeTab.click();
  await page.waitForTimeout(600);

  // Take screenshot of Home Dashboard in Marathi
  await page.screenshot({ path: path.join(artifactDir, 'verify_marathi_dashboard.png'), fullPage: false });

  // 4. Trigger Welcome Greeting Overlay in Marathi
  await page.evaluate(() => {
    sessionStorage.removeItem('et_welcome_dismissed_session');
  });
  await page.reload();
  await page.waitForTimeout(800);

  // Take screenshot of Welcome Back Overlay in Marathi
  await page.screenshot({ path: path.join(artifactDir, 'verify_marathi_welcome_overlay.png'), fullPage: false });
});
