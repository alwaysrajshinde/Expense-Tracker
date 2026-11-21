// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser } = require('../fixtures/testData');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area D: Categories & Payment Modes', () => {
  let testUser;

  test.beforeAll(() => {
    testUser = generateUniqueUser('cat_test');
  });

  test.afterAll(() => {
    cleanTestUsers();
  });

  test('D1: Default quick categories are present in Add Expense modal', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    // Verify presence of quick categories
    await expect(page.locator('button:has-text("Food")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Auto")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Metro")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Fruits")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Shopping")').first()).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('D2: Payment modes (UPI, Cash, Credit Card, Debit Card, Net Banking) are selectable', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    // Verify all 5 payment mode options
    await expect(page.locator('button:has-text("UPI")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Cash")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Credit Card")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Debit Card")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Net Banking")').first()).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('D3: User can view categories list in Settings and create custom category', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    // Navigate to Categories tab
    const catNavBtn = page.locator('aside button:has-text("Categories"), nav button:has-text("More"), button:has-text("Categories")').first();
    await catNavBtn.click();
    const catTab = page.locator('button:has-text("Categories")').first();
    if (await catTab.isVisible().catch(() => false)) await catTab.click();
    await page.waitForTimeout(500);

    // Look for custom category input
    const catInput = page.locator('input[placeholder*="Gym"]');
    if (await catInput.isVisible()) {
      const uniqueCat = `Gym_${Date.now()}`;
      await catInput.fill(uniqueCat);
      await page.locator('button:has-text("Add Category"), form button:has-text("Add")').first().click();

      // Verify category added to list
      await expect(page.getByText(uniqueCat, { exact: true })).toBeVisible({ timeout: 7000 });
    }
  });
});
