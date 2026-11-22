// @ts-check
const { test } = require('../fixtures/auth.fixture');
const path = require('path');

test('Capture Transactions Dropdown in Mobile View', async ({ page, authHelpers }) => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';
  await page.setViewportSize({ width: 393, height: 851 });

  // 1. Login
  await authHelpers.loginAsRaj();
  await page.waitForTimeout(600);

  // 2. Navigate to Transactions
  const txTab = page.locator('nav button').filter({ hasText: /Transactions|व्यवहार/i }).first();
  await txTab.click();
  await page.waitForTimeout(800);

  // 3. Find and click the Category dropdown
  // It has aria-label="Select Category Filter"
  const catDropdown = page.locator('button[aria-label="Select Category Filter"]').first();
  await catDropdown.click();
  await page.waitForTimeout(500);

  // Take screenshot of open dropdown
  await page.screenshot({ path: path.join(artifactDir, 'verify_transactions_dropdown_open.png'), fullPage: false });
});
