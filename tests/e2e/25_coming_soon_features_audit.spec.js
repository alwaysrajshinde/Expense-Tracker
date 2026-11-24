// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Coming Soon Features & Strict Access Control Audit', () => {
  test('1. Mobile: Upcoming features section is visible, badged correctly, and has no taglines', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More page
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Assert Upcoming Features header
    const upcomingHeader = page.locator('text=Upcoming Features').first();
    await expect(upcomingHeader).toBeVisible();

    // Verify all 4 registered coming soon features are visible in the upcoming section
    const sheetsFeature = page.locator('[data-testid="upcoming-feature-google_sheets_sync"]');
    await expect(sheetsFeature).toBeVisible();
    await expect(sheetsFeature).toContainText('Google Sheets');
    await expect(sheetsFeature).toContainText('Coming Soon');

    const scannerFeature = page.locator('[data-testid="upcoming-feature-receipt_scanner"]');
    await expect(scannerFeature).toBeVisible();
    await expect(scannerFeature).toContainText('Smart Receipt Scanner');
    await expect(scannerFeature).toContainText('Coming Soon');

    const recurringFeature = page.locator('[data-testid="upcoming-feature-recurring_expenses"]');
    await expect(recurringFeature).toBeVisible();
    await expect(recurringFeature).toContainText('Recurring Subscriptions');
    await expect(recurringFeature).toContainText('Coming Soon');

    const bankFeature = page.locator('[data-testid="upcoming-feature-bank_auto_sync"]');
    await expect(bankFeature).toBeVisible();
    await expect(bankFeature).toContainText('Smart Bank Statement Import');
    await expect(bankFeature).toContainText('Coming Soon');

    // Verify taglines are completely removed (no subtext paragraphs)
    const taglines = page.locator('[data-testid^="upcoming-feature-"] p.text-xs');
    await expect(taglines).toHaveCount(0);

    // Capture screenshot of Upcoming section
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_mobile_section.png'
    });
  });

  test('2. Mobile: Upcoming features strictly block click events and prevent unwanted scroll jumps', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const sheetsFeature = page.locator('[data-testid="upcoming-feature-google_sheets_sync"]');
    await expect(sheetsFeature).toHaveClass(/pointer-events-none/);

    const scannerFeature = page.locator('[data-testid="upcoming-feature-receipt_scanner"]');
    await expect(scannerFeature).toHaveClass(/pointer-events-none/);

    const recurringFeature = page.locator('[data-testid="upcoming-feature-recurring_expenses"]');
    await expect(recurringFeature).toHaveClass(/pointer-events-none/);

    const bankFeature = page.locator('[data-testid="upcoming-feature-bank_auto_sync"]');
    await expect(bankFeature).toHaveClass(/pointer-events-none/);

    await sheetsFeature.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Record scroll position once in view
    const scrollYBefore = await page.evaluate(() => window.scrollY);

    // Dispatching click does not alter scroll or open modal
    await sheetsFeature.dispatchEvent('click');
    await page.waitForTimeout(300);

    const scrollYAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollYAfter - scrollYBefore)).toBeLessThan(5);

    // Verify no modals are open
    await expect(page.locator('[data-testid^="coming-soon-modal-"]')).toHaveCount(0);
  });

  test('3. Desktop: Upcoming integrations preview cards are visible with no taglines and clicks blocked', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to Settings
    const settingsBtn = page.locator('aside button, nav button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await settingsBtn.click();
    await page.waitForTimeout(500);

    const desktopScannerBtn = page.locator('[data-testid="desktop-upcoming-receipt_scanner"]');
    await expect(desktopScannerBtn).toBeVisible();
    await expect(desktopScannerBtn).toContainText('Receipt Scanner');
    await expect(desktopScannerBtn).toContainText('Coming Soon');
    await expect(desktopScannerBtn).toHaveClass(/pointer-events-none/);

    // Capture screenshot of Desktop layout preview
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_desktop_layout.png'
    });
  });

  test('4. Functional Features Regression Guard: Core features continue working 100% normally', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // 1. Transactions page works
    const txTab = page.locator('nav button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('header h1:has-text("Transactions")')).toBeVisible();

    // 2. Reports page works
    const repTab = page.locator('nav button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await repTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('header h1:has-text("Reports")')).toBeVisible();

    // 3. Overview budget card works
    const homeTab = page.locator('nav button').filter({ hasText: /Overview|Home|होम/i }).first();
    await homeTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();
  });
});
