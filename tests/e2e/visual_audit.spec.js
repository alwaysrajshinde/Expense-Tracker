// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const path = require('path');

test.describe('Complete Visual QA Verification', () => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

  test('Capture and verify all user requested visual improvements', async ({ page, authHelpers }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 393, height: 851 });

    // 1. Landing Page (Redesigned like a top-tier fintech company)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'verify_public_landing.png'), fullPage: false });

    // 2. Login as Raj
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(1200);

    // 3. Main Dashboard: Verify NO "• Home" in header, NO duplicate date pill, NO month selector pill
    await page.screenshot({ path: path.join(artifactDir, 'verify_main_dashboard_nodup.png'), fullPage: false });

    // 4. Add Expense Modal: Verify prominent amount hero, quick chips, 4-col category grid, NO ugly dropdown
    const fabBtn = page.locator('button[aria-label="Quick Add Expense"]').first();
    await fabBtn.click();
    await page.waitForSelector('text=Save Expense', { timeout: 6000 });
    await page.waitForTimeout(600);

    // Verify Save Expense is visible in viewport
    const saveBtn = page.locator('button:has-text("Save Expense")');
    await expect(saveBtn).toBeInViewport();
    await page.screenshot({ path: path.join(artifactDir, 'verify_add_expense_redesign.png'), fullPage: false });

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]').first();
    await closeBtn.click();
    await page.waitForTimeout(800);

    // 5. Transactions Page: Verify custom styled dropdowns
    const txTab = page.locator('nav button:has-text("Transactions")').first();
    await txTab.click();
    await expect(page.locator('h2:has-text("Expense Records")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'verify_transactions_dropdowns.png'), fullPage: false });

    // 6. Settings Page: Verify Profile section, Upcoming Features, etc.
    const moreTab = page.locator('nav button:has-text("More")').first();
    await moreTab.click();
    await expect(page.locator('h1:has-text("More")').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'verify_settings_english.png'), fullPage: false });

    // 7. Language Switching Test: Switch to Marathi or Hindi in Settings
    const langRow = page.locator('button:has-text("Language"), button:has-text("भाषा")').first();
    await langRow.click();
    await page.waitForTimeout(600);

    // Select Hindi option
    const hiOption = page.locator('button:has-text("Hindi"), button:has-text("हिन्दी")').first();
    if (await hiOption.isVisible()) {
      await hiOption.click();
      await page.waitForTimeout(600);
    }

    // Close language modal
    const closeLangBtn = page.locator('button:has-text("Close")').first();
    if (await closeLangBtn.isVisible()) {
      await closeLangBtn.click();
      await page.waitForTimeout(600);
    }

    // Verify that Settings page has translated to Hindi
    await page.screenshot({ path: path.join(artifactDir, 'verify_language_hindi_settings.png'), fullPage: false });

    // Navigate to Home tab: verify navigation tabs and dashboard translated to Hindi
    const homeTab = page.locator('nav button').first();
    await homeTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'verify_language_hindi_home.png'), fullPage: false });
  });
});
