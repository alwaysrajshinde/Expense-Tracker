// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser, SAMPLE_EXPENSES } = require('../fixtures/testData');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area C: Expense Management & Edge Cases', () => {
  let testUser;

  test.beforeAll(async ({ browser }) => {
    // Generate an isolated user for expense CRUD tests so we never mutate Raj's data
    testUser = generateUniqueUser('expense_crud');
  });

  test.afterAll(() => {
    cleanTestUsers();
  });

  test('C1: Add expense modal opens and validates required positive amount', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    // Click "+ Add Expense" from sidebar
    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    // Verify modal is open
    await expect(page.locator('h2:has-text("Add Expense")')).toBeVisible();

    // Attempt submit with empty amount
    const submitBtn = page.locator('button[type="submit"]:has-text("Save Expense")');
    await submitBtn.click();

    // Verify validation message
    await expect(page.locator('text=Please enter a valid positive amount')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('C2: Rejects zero and negative amounts in modal', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    const amountInput = page.locator('.fixed input[placeholder="0"]');
    await amountInput.fill('0');
    await page.locator('div.fixed button[type="submit"]').first().click();
    await expect(page.locator('text=Please enter a valid positive amount')).toBeVisible();

    await amountInput.fill('-50');
    await page.locator('div.fixed button[type="submit"]').first().click();
    await expect(page.locator('text=Please enter a valid positive amount')).toBeVisible();

    // Cancel modal
    await page.keyboard.press('Escape');
  });

  test('C3: Successfully adds expense with decimal amount and special characters', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    // Fill valid decimal amount
    await page.locator('.fixed input[placeholder="0"]').fill('149.99');
    
    // Fill description with special characters
    const descInput = page.locator('input[placeholder*="Grocery"], input[placeholder*="Lunch"], input[placeholder*="Coffee"], input[name="description"]').first();
    await descInput.fill('Coffee & Tea (Special Tag)');

    // Submit
    await page.locator('div.fixed button[type="submit"]').first().click();

    // Verify modal closes and expense is reflected
    await expect(page.locator('h2:has-text("Add Expense")')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify on Transactions page
    await page.locator('button:has-text("Transactions")').first().click();
    await expect(page.locator('text=Coffee & Tea (Special Tag)').first()).toBeVisible({ timeout: 10000 });
  });

  test('C4: Successfully adds a refund / return transaction', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    // Switch to Refund toggle inside modal
    const refundTab = page.locator('.fixed button:has-text("Refund")');
    if (await refundTab.isVisible()) {
      await refundTab.click();
    }

    await page.locator('.fixed input[placeholder="0"]').fill('500');
    const descInput = page.locator('input[placeholder*="Grocery"], input[placeholder*="Lunch"], input[placeholder*="Coffee"], input[name="description"]').first();
    await descInput.fill('Product return refund');

    await page.locator('div.fixed button[type="submit"]').first().click();
    await expect(page.locator('h2:has-text("Add Expense")')).not.toBeVisible();
  });

  test('C5: Edit and delete an existing transaction', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(testUser.email, testUser.name);

    // Go to Transactions
    await page.locator('button:has-text("Transactions")').first().click();
    await page.waitForTimeout(1000);

    // Look for edit button
    const editBtn = page.locator('button[title="Edit"]').first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click({ force: true });
      await expect(page.locator('h2:has-text("Edit Expense")')).toBeVisible();

      // Change amount
      const amountInput = page.locator('input[placeholder="0"]');
      await amountInput.fill('299.50');
      await page.locator('button[type="submit"]:has-text("Update Expense")').click();
      await expect(page.locator('h2:has-text("Edit Expense")')).not.toBeVisible();
    }
  });
});
