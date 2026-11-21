// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser } = require('../fixtures/testData');
const { getRajRecordCount, cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area A: User Authentication & Session Management', () => {
  test.beforeEach(async ({ page, authHelpers }) => {
    await authHelpers.clearSession();
  });

  test.afterAll(() => {
    cleanTestUsers();
  });

  test('A1: Login screen presents consumer "Continue with Google" without technical inputs', async ({ page }) => {
    await page.goto('/');
    const continueBtn = page.locator('button:has-text("Continue with Google")');
    await expect(continueBtn).toBeVisible();

    // Verify technical inputs are not exposed to ordinary consumers
    await expect(page.locator('text=OAuth 2.0 Web Client ID')).not.toBeVisible();
    await expect(page.locator('text=Security Passphrase')).not.toBeVisible();
  });

  test('A2: Invalid email format is rejected with validation message', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Continue with Google")').click();
    await page.locator('button:has-text("Use another Google account")').click();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email-format');
    await page.locator('button[type="submit"]:has-text("Sign in with Google"), button[type="submit"]').click();

    // Verify rejection by form validation (browser HTML5 or React alert)
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('A3: Existing user (Raj Shinde) logs in and historical vault is loaded', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Verify Raj's greeting and budget
    await expect(page.locator('text=Raj').first()).toBeVisible();
    await expect(page.locator('text=Monthly Budget')).toBeVisible();

    // Ensure database records are preserved
    const count = getRajRecordCount();
    expect(count).toBeGreaterThanOrEqual(1216);
  });

  test('A4: New user registration automatically initializes an isolated personal vault', async ({ page, authHelpers }) => {
    const newUser = generateUniqueUser('newbie');
    await authHelpers.loginAsNewUser(newUser.email, newUser.name);

    // Verify new user dashboard opens
    await expect(page.locator('text=Monthly Budget')).toBeVisible();

    // Verify new user starts with 0 spent
    const spentText = await page.locator('text=Spent').locator('..').innerText();
    expect(spentText).toContain('₹0');
  });

  test('A5: Session persistence survives page reload', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.reload();

    // Should stay authenticated without kicking back to login
    await expect(page.locator('button:has-text("Continue with Google")')).not.toBeVisible();
    await expect(page.locator('text=Monthly Budget')).toBeVisible();
  });

  test('A6: User can disconnect / logout safely', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await authHelpers.logout();

    // Verify returned to login screen
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});
