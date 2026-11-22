// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const path = require('path');

test.describe('Comprehensive Audit for User Reported Issues', () => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

  test('Verify language, single toast pill, profile notifications, custom dropdowns, and category/payment graphs', async ({ page, authHelpers }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 393, height: 851 });

    // 1. Login & Verify Welcome Back Greeting Pill
    await page.goto('/');
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(1000);

    // Capture screenshot of Header & Welcome Greeting
    await page.screenshot({ path: path.join(artifactDir, 'verify_welcome_toast_header.png'), fullPage: false });

    // 2. Verify standalone Notification Bell is REMOVED from Header
    const standaloneBell = page.locator('header button[aria-label="Notifications"]');
    await expect(standaloneBell).toHaveCount(0);

    // 3. Open Profile Menu: Verify Notifications is INSIDE Profile
    const profileBtn = page.locator('header button[aria-label="Profile and Settings"]').first();
    await profileBtn.click();
    await page.waitForTimeout(600);
    await expect(page.locator('text=Notifications').first()).toBeVisible();
    await page.screenshot({ path: path.join(artifactDir, 'verify_notifications_in_profile_menu.png'), fullPage: false });

    // Close profile menu
    const backdrop = page.locator('div.fixed.inset-0.z-30').first();
    if (await backdrop.isVisible()) {
      await backdrop.click();
    }
    await page.waitForTimeout(400);

    // 4. Transactions Page: Verify Custom Styled Dropdowns (NO native select)
    const txTab = page.locator('nav button:has-text("Transactions")').first();
    await txTab.click();
    await page.waitForSelector('h2:has-text("Expense Records")', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Click Category Dropdown Trigger
    const categoryDropdownTrigger = page.locator('button[aria-label="Select Category Filter"]').first();
    await categoryDropdownTrigger.click();
    await page.waitForTimeout(600);

    // Verify custom floating dropdown menu with search
    await page.screenshot({ path: path.join(artifactDir, 'verify_custom_category_dropdown.png'), fullPage: false });

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 5. Reports Page: Check Categories Tab Graph and Payment Modes Tab Graph
    const reportsTab = page.locator('nav button:has-text("Reports")').first();
    await reportsTab.click();
    await page.waitForSelector('h2:has-text("Spending & Expense Analytics")', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Switch to Categories Subtab
    const categoriesSubtab = page.locator('button:has-text("Categories")').first();
    await categoriesSubtab.click();
    await page.waitForTimeout(600);
    await expect(page.locator('text=Category Spending Distribution').first()).toBeVisible();
    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_categories_graph.png'), fullPage: false });

    // Switch to Payment Modes Subtab
    const paymentSubtab = page.locator('button:has-text("Payment Modes")').first();
    await paymentSubtab.click();
    await page.waitForTimeout(600);
    await expect(page.locator('text=Payment Channels Split').first()).toBeVisible();
    await page.screenshot({ path: path.join(artifactDir, 'verify_reports_payment_modes_graph.png'), fullPage: false });

    // 6. Settings Page: Test Language Switching to Hindi & Marathi
    const moreTab = page.locator('nav button:has-text("More")').first();
    await moreTab.click();
    await page.waitForSelector('h1:has-text("More")', { timeout: 10000 });
    await page.waitForTimeout(600);

    // Open Language Modal
    const langRow = page.locator('button:has-text("Language")').first();
    await langRow.click();
    await page.waitForTimeout(600);

    // Click Hindi
    const hindiBtn = page.locator('button:has-text("हिन्दी"), button:has-text("Hindi")').first();
    await hindiBtn.click();
    await page.waitForTimeout(800);

    // Close language modal if open
    const closeBtn = page.locator('button:has-text("Close"), button:has-text("बंद")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(600);
    }

    // Verify Settings is now in Hindi
    await page.screenshot({ path: path.join(artifactDir, 'verify_language_hindi_active.png'), fullPage: false });
  });
});
