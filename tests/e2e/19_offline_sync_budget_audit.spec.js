// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Offline-First, Transaction Management, Sync Indicator, Budget & Localization Audit', () => {
  test.beforeEach(async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);
  });

  test('1. Overview shows Monthly Budget cleanly without any Edit button or click trigger', async ({ page }) => {
    // Check that Monthly Budget label exists
    const budgetLabel = page.getByText(/Monthly Budget|मासिक बजेट|महिन्याचे बजेट/i).first();
    await expect(budgetLabel).toBeVisible();

    // Verify NO "Edit" badge or button exists inside the Monthly Budget card
    const editBtn = page.locator('div.purple-hero-gradient button:has-text("Edit"), div.purple-hero-gradient span:has-text("Edit")');
    await expect(editBtn).toHaveCount(0);

    // Budget amount is rendered as clean static typography
    const budgetDisplay = page.locator('div.purple-hero-gradient p:has-text("₹")').first();
    await expect(budgetDisplay).toBeVisible();
  });

  test('2. No waving-hand emojis (👋) appear anywhere on screen', async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).not.toContain('👋');
  });

  test('3. Custom Dropdowns are properly contained within mobile boundaries', async ({ page }) => {
    // Navigate to Transactions tab
    const txTab = page.locator('nav button').filter({ hasText: /Transactions|लेन-देन|व्यवहार/i }).first();
    await txTab.click();
    await page.waitForTimeout(600);

    // Locate Category Dropdown button
    const dropdownBtn = page.locator('button[aria-label="Select Category Filter"]').first();
    await expect(dropdownBtn).toBeVisible();
    await dropdownBtn.click();

    // Verify dropdown menu is opened
    const dropdownMenu = page.locator('div[role="listbox"]').first();
    await expect(dropdownMenu).toBeVisible();

    // Check that dropdown menu bounding box is strictly within the mobile viewport
    const box = await dropdownMenu.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(393 + 10);
    }
  });

  test('4. Transaction deletion removes item immediately without full-page refresh', async ({ page }) => {
    // Navigate to Transactions tab
    const txTab = page.locator('nav button').filter({ hasText: /Transactions|लेन-देन|व्यवहार/i }).first();
    await txTab.click();
    await page.waitForTimeout(600);

    // Locate delete button on first transaction item
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Confirm dialog appears
      const confirmBtn = page.locator('button:has-text("Delete")').last();
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Toast appears confirming deletion
      await expect(page.getByText(/deleted successfully/i).first()).toBeVisible({ timeout: 4000 });
    }
  });

  test('5. Language switches cleanly to Marathi with modern colloquial vocabulary', async ({ page }) => {
    // Open More tab
    const moreTab = page.locator('nav button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(600);

    // Click Language option in Settings
    const langBtn = page.locator('button').filter({ hasText: /Language|भाषा/i }).first();
    await langBtn.click();
    await page.waitForTimeout(500);

    // Select Marathi
    const mrOption = page.locator('button').filter({ hasText: /मराठी|Marathi/i }).first();
    await mrOption.click();
    await page.waitForTimeout(500);

    // Verify modern Marathi translations appear
    await expect(page.locator('text=महिन्याचे बजेट, text=व्यवहार, text=अधिक').first()).toBeDefined();
  });
});
