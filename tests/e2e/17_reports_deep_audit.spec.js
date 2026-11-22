// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Reports Deep Analytics & Visual Math Audit', () => {
  test.beforeEach(async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay if present
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Reports page
    const reportsNav = page.locator('nav button, nav a').filter({ hasText: /Reports|रिपोर्ट/i }).first();
    await reportsNav.click();
    await page.waitForTimeout(800);
  });

  test('Verify Unified Single-Row Navigation (Zero Extra Space or Stacked Tab Rows)', async ({ page }) => {
    // Assert presence of the 4 unified segments
    const overviewTab = page.locator('button:has-text("Overview")').first();
    const categoriesTab = page.locator('button:has-text("Categories")').first();
    const paymentTab = page.locator('button:has-text("Payment Modes")').first();
    const yearlyTab = page.locator('button:has-text("Yearly")').first();

    await expect(overviewTab).toBeVisible();
    await expect(categoriesTab).toBeVisible();
    await expect(paymentTab).toBeVisible();
    await expect(yearlyTab).toBeVisible();

    // Assert that the old redundant stacked row ("Monthly Report" button) is NOT present
    const oldMonthlySwitcher = page.locator('button:has-text("Monthly Report")');
    await expect(oldMonthlySwitcher).toHaveCount(0);
  });

  test('Verify Category Donut Chart Forms Complete 360° Closed Circle (No Half Circle)', async ({ page }) => {
    // Locate SVG donut chart
    const svgChart = page.locator('svg').filter({ has: page.locator('circle') }).first();
    await expect(svgChart).toBeVisible({ timeout: 6000 });

    // Inspect all slices and calculate circumference completeness
    const completeness = await page.evaluate(() => {
      const svg = document.querySelector('svg circle');
      if (!svg) return 0;
      const radius = parseFloat(svg.getAttribute('r') || '63');
      const fullCircumference = 2 * Math.PI * radius;

      const slices = Array.from(document.querySelectorAll('svg circle[stroke-dasharray]'));
      if (slices.length === 0) return 0;

      let totalDashes = 0;
      slices.forEach(c => {
        const da = c.getAttribute('stroke-dasharray') || '';
        const match = da.split(/\s+/)[0];
        if (match) {
          totalDashes += parseFloat(match) || 0;
        }
      });

      return Math.round((totalDashes / fullCircumference) * 100);
    });

    // Circumference must be 100% (or >= 99% with floating point rounding)
    expect(completeness).toBeGreaterThanOrEqual(99);
  });

  test('Verify Continuous 6-Month Spending Trend Bar Chart (Jun to Nov)', async ({ page }) => {
    const trendHeading = page.locator('h3:has-text("Monthly Spending Trend")').first();
    await expect(trendHeading).toBeVisible({ timeout: 5000 });

    // Count rendered month bars along x-axis
    const monthLabels = page.locator('div.border-b span.text-\\[11px\\], div.border-b span.text-xs');
    const labelCount = await monthLabels.count();
    expect(labelCount).toBe(6);

    // Verify last month is 'Nov'
    const lastLabel = await monthLabels.nth(5).textContent();
    expect(lastLabel?.trim()).toBe('Nov');
  });

  test('Verify Future Month Navigation Boundary is Disabled', async ({ page }) => {
    // Locate Next Month button
    const nextBtn = page.locator('button[aria-label="Next Month"]').first();
    await expect(nextBtn).toBeVisible({ timeout: 5000 });

    // Assert that button is disabled
    const isDisabled = await nextBtn.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('Verify Categories & Payment Modes Sub-Tabs Render Rich Analytics', async ({ page }) => {
    // Click Categories Tab
    const categoriesTab = page.locator('button:has-text("Categories")').first();
    await categoriesTab.click();
    await page.waitForTimeout(500);

    // Verify Category Spending Distribution visual ranking chart
    const catDistHeading = page.locator('h3:has-text("Category Spending Distribution")').first();
    await expect(catDistHeading).toBeVisible({ timeout: 5000 });

    // Click Payment Modes Tab
    const paymentTab = page.locator('button:has-text("Payment Modes")').first();
    await paymentTab.click();
    await page.waitForTimeout(500);

    // Verify Payment Mode Breakdown Details
    const pmHeading = page.locator('h3:has-text("Payment Channels Split"), h3:has-text("Payment Mode Breakdown")').first();
    await expect(pmHeading).toBeVisible({ timeout: 5000 });
  });
});
