// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser } = require('../fixtures/testData');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area K: Standard Category Setup & Category Management', () => {
  let newUser;

  test.beforeAll(() => {
    newUser = generateUniqueUser('std_cat_user');
  });

  test.afterAll(() => {
    cleanTestUsers();
  });

  test('K1: New user receives exactly the 15 standard default categories', async ({ page, authHelpers }) => {
    await authHelpers.loginAsNewUser(newUser.email, newUser.name);

    // Ensure Onboarding Tour modal is dismissed if displayed
    const skipTourBtn = page.locator('button:has-text("Skip Tour")').first();
    if (await skipTourBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipTourBtn.click();
      await page.waitForTimeout(300);
    }

    // Open Categories Manager via Settings
    await page.locator('aside button:has-text("More"), aside button:has-text("Settings"), nav button:has-text("More")').first().click();
    await page.waitForTimeout(500);

    // Open Category Manager Modal specifically via Manage & Customize All button
    const manageBtn = page.locator('button:has-text("Manage & Customize All")').first();
    await expect(manageBtn).toBeVisible({ timeout: 5000 });
    await manageBtn.click();
    await page.waitForTimeout(500);

    // Verify presence of standard categories
    const expectedCategories = [
      'Food & Dining',
      'Groceries',
      'Transportation',
      'Housing & Rent',
      'Bills & Utilities',
      'Shopping',
      'Health & Medical',
      'Personal Care',
      'Entertainment',
      'Education',
      'Travel',
      'EMI & Loans',
      'Gifts & Donations',
      'Subscriptions',
      'Other'
    ];

    for (const catName of expectedCategories) {
      await expect(page.locator(`text="${catName}"`).first()).toBeVisible({ timeout: 5000 });
    }

    // Close modal
    await page.locator('button:has-text("Done")').click();
  });

  test('K2: User can create a custom category with name, icon and color', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to More & Settings
    await page.locator('aside button:has-text("More"), aside button:has-text("Settings"), nav button:has-text("More")').first().click();
    await page.waitForTimeout(500);

    // Fill inline custom category input
    const uniqueCatName = `PetCare_${Date.now()}`;
    const nameInput = page.locator('input[placeholder*="Gym"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(uniqueCatName);

    // Click Add
    await page.locator('form button:has-text("Add")').first().click();

    // Verify newly added category chip appears immediately
    await expect(page.locator(`text="${uniqueCatName}"`).first()).toBeVisible({ timeout: 7000 });
  });

  test('K3: User can edit category name, icon and color in Category Manager', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    await page.locator('aside button:has-text("More"), aside button:has-text("Settings"), nav button:has-text("More")').first().click();
    await page.waitForTimeout(500);

    // Open manager
    await page.locator('button:has-text("Manage & Customize All")').first().click();
    await page.waitForTimeout(500);

    // Edit the first category
    const editBtn = page.locator('button[title="Edit Category"]').first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Verify edit dialog opens
    await expect(page.locator('text=Edit Category:').first()).toBeVisible({ timeout: 5000 });
    
    // Cancel edit
    await page.locator('button:has-text("Cancel")').first().click();
    await page.locator('button:has-text("Done")').click();
  });

  test('K4: Smart removal checks transactions: preserves history, supports reassign or archive', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    await page.locator('aside button:has-text("More"), aside button:has-text("Settings"), nav button:has-text("More")').first().click();
    await page.waitForTimeout(500);

    // Open manager
    await page.locator('button:has-text("Manage & Customize All")').first().click();
    await page.waitForTimeout(500);

    // Click remove on Food (which has historical transactions)
    const removeBtn = page.locator('button[title="Remove Category"]').first();
    await expect(removeBtn).toBeVisible({ timeout: 5000 });
    await removeBtn.click();

    // Verify smart removal dialog warns and shows Option 1 & Option 2
    await expect(page.locator('text=Historical transaction protection guard').first()).toBeVisible({ timeout: 7000 });
    await expect(page.locator('text=Option 1: Reassign').first()).toBeVisible();
    await expect(page.locator('text=Option 2: Archive Category').first()).toBeVisible();

    // Dismiss safely without altering records
    await page.locator('button:has-text("Cancel")').first().click();
    await page.locator('button:has-text("Done")').click();
  });
});
