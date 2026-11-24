// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser } = require('../fixtures/testData');
const { getRajRecordCount, cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area A: Universal User Authentication & Session Management', () => {
  test.beforeEach(async ({ page, authHelpers }) => {
    await authHelpers.clearSession();
  });

  test.afterAll(() => {
    cleanTestUsers();
  });

  test('A1: Login screen presents universal Sign In & Create Account without technical inputs', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal if landing page is shown
    const landingSigninBtn = page.locator('button:has-text("Sign In to Vault"), button:has-text("Sign In")').first();
    if (await landingSigninBtn.isVisible()) {
      await landingSigninBtn.click();
    }

    const signinBtn = page.locator('button:has-text("Sign In")').first();
    await expect(signinBtn).toBeVisible();

    const signupTab = page.locator('button:has-text("Create Account")').first();
    await expect(signupTab).toBeVisible();

    // Verify technical inputs are not exposed to consumers
    await expect(page.locator('text=OAuth 2.0 Web Client ID')).not.toBeVisible();
    await expect(page.locator('text=Security Passphrase')).not.toBeVisible();
    await expect(page.locator('text=Google Sheet ID')).not.toBeVisible();
  });

  test('A2: Invalid email format is rejected with validation message', async ({ page }) => {
    await page.goto('/');
    const signinBtn = page.locator('button:has-text("Sign In")').first();
    if (await signinBtn.isVisible()) {
      await signinBtn.click();
    }
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('invalid-email-format');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('secret123');

    await page.locator('button[type="submit"]:has-text("Sign In")').first().click();

    // Verify rejection by form validation (browser HTML5 or React alert)
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('A3: Existing user (Raj Shinde) signs in and historical vault is loaded', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Verify dashboard budget
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();

    // Ensure database records are preserved
    const count = getRajRecordCount();
    expect(count).toBeGreaterThanOrEqual(1216);
  });

  test('A4: New user registration automatically initializes an isolated personal vault', async ({ page, authHelpers }) => {
    const newUser = generateUniqueUser('newbie');
    await authHelpers.loginAsNewUser(newUser.email, newUser.name);

    // Verify new user dashboard opens
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();

    // Verify new user starts with 0 spent
    const spentText = await page.locator('text=Spent').locator('..').innerText();
    expect(spentText).toContain('₹0');
  });

  test('A5: Session persistence survives page reload', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.reload();

    // Should stay authenticated without kicking back to login
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).not.toBeVisible();
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();
  });

  test('A6: User can disconnect / logout safely', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await authHelpers.logout();

    // Verify returned to login screen
    await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible();
  });
});
