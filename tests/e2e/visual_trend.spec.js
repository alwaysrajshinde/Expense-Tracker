// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const path = require('path');

test.describe('Visual QA Self-Verification - Reports Trend', () => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

  test('Verify monthly spending trend 6 bars', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Reports Tab
    const repTab = page.locator('button:has-text("Reports")').first();
    await repTab.click();
    await page.waitForSelector('h2:has-text("Spending & Expense Analytics")', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Scroll to Monthly Spending Trend
    const trendSection = page.locator('text=Monthly Spending Trend');
    await trendSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_trend.png'), fullPage: false });
  });
});
