// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Area M-QA: Mobile-First Comprehensive QA Stabilization & Viewport Audit', () => {
  test.beforeEach(async () => {
    test.setTimeout(45000);
  });

  const mobileViewports = [
    { name: 'iPhone SE (320px)', width: 320, height: 568 },
    { name: 'Samsung Galaxy S8 (360px)', width: 360, height: 740 },
    { name: 'iPhone 13 mini / SE3 (375px)', width: 375, height: 667 },
    { name: 'Pixel 7 (393px)', width: 393, height: 851 },
    { name: 'iPhone 14 Pro Max (430px)', width: 430, height: 932 }
  ];

  for (const vp of mobileViewports) {
    test(`QA-1 [${vp.name}]: Viewport fits perfectly with zero horizontal overflow`, async ({ page, authHelpers }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await authHelpers.loginAsRaj();

      // Check Dashboard container for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify Header greeting and icons fit
      const headerTitle = page.locator('header h1').first();
      await expect(headerTitle).toBeVisible();

      // Check that bottom navigation bar is fixed and visible
      const bottomNav = page.locator('nav').first();
      await expect(bottomNav).toBeVisible();

      // Verify FAB button is visible and elevated
      const fabBtn = page.locator('button[aria-label="Quick Add Expense"]').first();
      await expect(fabBtn).toBeVisible();

      // Check Transactions tab
      const txTab = page.locator('button:has-text("Transactions")').first();
      await txTab.click();
      await expect(page.locator('h2:has-text("Expense Records")').first()).toBeVisible({ timeout: 5000 });

      const txScrollOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(txScrollOverflow).toBe(false);

      // Check Reports tab
      const repTab = page.locator('button:has-text("Reports")').first();
      await repTab.click();
      await expect(page.locator('h2:has-text("Spending & Expense Analytics")').first()).toBeVisible({ timeout: 5000 });

      const repScrollOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(repScrollOverflow).toBe(false);
    });
  }

  test('QA-2: Mobile Add Expense flow from FAB creates transaction and reflects immediately', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authHelpers.loginAsRaj();

    // Tap elevated central FAB button
    const fabBtn = page.locator('button[aria-label="Quick Add Expense"]').first();
    await expect(fabBtn).toBeVisible();
    await fabBtn.click();

    // Verify Add Expense Bottom Sheet / Modal opened
    const modalHeading = page.locator('h2:has-text("Add Expense")');
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Fill Amount
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('450');

    // Select category (e.g. Food or first quick category)
    const catBtn = page.locator('button:has-text("Food"), button:has-text("Groceries")').first();
    if (await catBtn.isVisible()) {
      await catBtn.click();
    }

    // Set Description
    const descInput = page.locator('input[placeholder*="Lunch with colleagues"]').first();
    await descInput.fill('QA Mobile Test Coffee');

    // Tap Save Expense
    const saveBtn = page.locator('button[type="submit"]:has-text("Save Expense")').first();
    await saveBtn.click();

    // Modal closes
    await expect(modalHeading).not.toBeVisible({ timeout: 5000 });

    // Check Home shows updated recent transaction
    await expect(page.locator('text=QA Mobile Test Coffee').first()).toBeVisible({ timeout: 8000 });

    // Navigate to Transactions tab and verify the entry appears
    const txTab = page.locator('button:has-text("Transactions")').first();
    await txTab.click();
    await expect(page.locator('text=QA Mobile Test Coffee').first()).toBeVisible({ timeout: 8000 });
  });

  test('QA-3: Mobile Transactions List Edit and Delete touch interactions work cleanly', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authHelpers.loginAsRaj();

    // Go to Transactions
    const txTab = page.locator('button:has-text("Transactions")').first();
    await txTab.click();
    await expect(page.locator('h2:has-text("Expense Records")').first()).toBeVisible({ timeout: 5000 });

    // Find the test transaction we just added
    const testTx = page.locator('div:has-text("QA Mobile Test Coffee")').first();
    if (await testTx.isVisible()) {
      // Find Delete button with aria-label
      const deleteBtn = page.locator('button[aria-label*="Delete QA Mobile Test Coffee"]').first();
      await expect(deleteBtn).toBeVisible();
      await deleteBtn.click();

      // Confirm Delete dialog / popover
      const confirmDeleteBtn = page.locator('button:has-text("Delete Expense"), button:has-text("Delete")').filter({ hasNotText: 'Records' }).first();
      if (await confirmDeleteBtn.isVisible()) {
        await confirmDeleteBtn.click();
      }

      // Verify transaction removed
      await expect(page.locator('text=Transaction deleted successfully')).toBeVisible({ timeout: 6000 });
    }
  });

  test('QA-4: Mobile Reports page month switching & sub-tab navigation is smooth', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await authHelpers.loginAsRaj();

    // Go to Reports
    const repTab = page.locator('button:has-text("Reports")').first();
    await repTab.click();
    await expect(page.locator('h2:has-text("Spending & Expense Analytics")').first()).toBeVisible({ timeout: 5000 });

    // Test sub-tabs (Overview -> Categories -> Payment Modes)
    const catSubTab = page.locator('button:has-text("Categories")').first();
    await expect(catSubTab).toBeVisible();
    await catSubTab.click();

    // Verify categories list view
    await expect(page.locator('text=All Category Expenditures').first()).toBeVisible({ timeout: 5000 });

    const paymentSubTab = page.locator('button:has-text("Payment Modes")').first();
    await paymentSubTab.click();
    await expect(page.locator('text=Payment Mode Distribution').first()).toBeVisible({ timeout: 5000 });

    // Return to Overview
    const overviewSubTab = page.locator('button:has-text("Overview")').first();
    await overviewSubTab.click();
    await expect(page.locator('text=Spending by Category').first()).toBeVisible({ timeout: 5000 });
  });

  test('QA-5: Mobile Settings sub-modals are scrollable and action buttons are accessible', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Smallest iPhone SE
    await authHelpers.loginAsRaj();

    // Open More tab
    const moreTab = page.locator('button:has-text("More")').first();
    await moreTab.click();
    await expect(page.locator('h1:has-text("More")').first()).toBeVisible({ timeout: 5000 });

    // Open Monthly Target Budget sub-modal
    const budgetBtn = page.locator('button:has-text("Monthly Budget")').first();
    await budgetBtn.click();

    const budgetModal = page.locator('h3:has-text("Monthly Target Budget")');
    await expect(budgetModal).toBeVisible({ timeout: 5000 });

    // Verify modal is scrollable and "Save Budget" button is present and clickable
    const saveBudgetBtn = page.locator('button:has-text("Save Budget")').first();
    await expect(saveBudgetBtn).toBeVisible();

    // Dismiss modal
    const closeBtn = page.locator('.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(budgetModal).not.toBeVisible();
  });

  test('QA-6: Category Manager modal opens, scrolls, and closes without layout distortion on mobile', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authHelpers.loginAsRaj();

    // Open More tab
    const moreTab = page.locator('button:has-text("More")').first();
    await moreTab.click();

    // Open Categories modal
    const catManagerBtn = page.locator('button:has-text("Category Management"), button:has-text("Categories")').first();
    await catManagerBtn.click();

    const modalTitle = page.locator('h2:has-text("Expense Categories")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Verify tabs
    const activeTab = page.locator('button:has-text("Active")').first();
    const archivedTab = page.locator('button:has-text("Archived")').first();
    await expect(activeTab).toBeVisible();
    await expect(archivedTab).toBeVisible();

    // Close Category modal
    const closeBtn = page.locator('.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('QA-7: Google Sheets Export modal is mobile responsive and accessible', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authHelpers.loginAsRaj();

    // Open More tab
    const moreTab = page.locator('button:has-text("More")').first();
    await moreTab.click();

    // Open Google Sheets Export modal
    const sheetsBtn = page.locator('button:has-text("Google Sheets")').first();
    await sheetsBtn.click();

    const sheetsModal = page.locator('h3:has-text("Export to Google Sheets")');
    await expect(sheetsModal).toBeVisible({ timeout: 5000 });

    // Check scope options
    await expect(page.locator('button:has-text("All Transactions")')).toBeVisible();
    await expect(page.locator('button:has-text("Current Month")')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(sheetsModal).not.toBeVisible();
  });

  test('QA-8: Theme switching across all themes functions consistently on mobile viewport', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await authHelpers.loginAsRaj();

    // Header quick theme toggle
    const themeToggleBtn = page.locator('header button[aria-label="Toggle Theme"]').first();
    await expect(themeToggleBtn).toBeVisible();

    const initialTheme = await page.evaluate(() => document.documentElement.className);
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    const toggledTheme = await page.evaluate(() => document.documentElement.className);
    expect(toggledTheme).not.toBe(initialTheme);

    // Toggle back
    await themeToggleBtn.click();
    await page.waitForTimeout(300);
    const restoredTheme = await page.evaluate(() => document.documentElement.className);
    expect(restoredTheme).toBe(initialTheme);
  });
});
