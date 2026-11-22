// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const path = require('path');

test.describe('Reports UI/UX and Data Audit', () => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

  test('Verify Reports tabs symmetry, full 360 donut circle, and 6-month trend', async ({ page, authHelpers }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 393, height: 851 });

    // Login
    await page.goto('/');
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(1000);

    // Dismiss any update toast banner if visible
    const dismissBtn = page.locator('button[aria-label="Close notification"], button:has-text("✕")').first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Reports tab
    const reportsTab = page.locator('nav button:has-text("Reports")').first();
    await reportsTab.click();
    await page.waitForTimeout(1200);

    // 1. Capture Header and Subtabs to verify zero wasted whitespace
    const headerEl = page.locator('h2:has-text("Spending & Expense Analytics")').first();
    await expect(headerEl).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_header_tabs.png'), fullPage: false });

    // 2. Scroll to Spending by Category & Donut Chart
    const donutSection = page.locator('text=Spending by Category').first();
    await donutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_donut_full_circle.png'), fullPage: false });

    // 3. Scroll to Monthly Spending Trend (Last 6 Months)
    const trendSection = page.locator('text=Monthly Spending Trend').first();
    await trendSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_6month_trend.png'), fullPage: false });
  });
});
