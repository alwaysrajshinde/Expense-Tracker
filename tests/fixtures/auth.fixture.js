// @ts-check
const { test: base, expect } = require('@playwright/test');

/**
 * Custom Playwright Fixture with Reusable Auth Helpers
 */
const test = base.extend({
  authHelpers: async ({ page }, use) => {
    const helpers = {
      // Clear all session & cache storage
      async clearSession() {
        await page.goto('/');
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.reload();
      },

      // Login as Raj Shinde (existing account with historical data)
      async loginAsRaj() {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        
        // Wait for Continue with Google button
        const continueBtn = page.locator('button:has-text("Continue with Google")');
        await expect(continueBtn).toBeVisible({ timeout: 10000 });
        await continueBtn.click();

        // Select Raj Shinde from account list
        const rajBtn = page.locator('button:has-text("Raj Shinde")');
        await expect(rajBtn).toBeVisible({ timeout: 5000 });
        await rajBtn.click();

        // Wait for dashboard to load
        await expect(page.locator('text=Monthly Budget')).toBeVisible({ timeout: 15000 });
      },

      // Login as new / custom user
      async loginAsNewUser(email, name = 'Test User') {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const continueBtn = page.locator('button:has-text("Continue with Google")');
        await expect(continueBtn).toBeVisible({ timeout: 10000 });
        await continueBtn.click();

        // Click "Use another Google account"
        const anotherAccountBtn = page.locator('button:has-text("Use another Google account")');
        await expect(anotherAccountBtn).toBeVisible({ timeout: 5000 });
        await anotherAccountBtn.click();

        // Fill custom account form
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        await emailInput.fill(email);

        const nameInput = page.locator('input[placeholder="Account Name (e.g. John Doe)"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill(name);
        }

        const submitBtn = page.locator('button[type="submit"]:has-text("Sign in with Google"), button[type="submit"]');
        await submitBtn.click();

        // Wait for dashboard to open
        await expect(page.locator('text=Monthly Budget')).toBeVisible({ timeout: 15000 });
      },

      // Logout helper
      async logout() {
        // Direct click on sidebar logout button or profile dropdown logout
        const logoutBtn = page.locator('button[title="Log Out"], button:has-text("Log Out")').first();
        if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutBtn.click();
        } else {
          // Open profile card dropdown
          const profileCard = page.locator('[data-testid="sidebar-profile-card"]').first();
          if (await profileCard.isVisible()) {
            await profileCard.click();
            await page.locator('button:has-text("Log Out")').click();
          } else {
            // Fallback clear session
            await page.evaluate(() => localStorage.removeItem('expense_tracker_auth_session'));
            await page.reload();
          }
        }
        await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible({ timeout: 10000 });
      }
    };

    await use(helpers);
  }
});

module.exports = { test, expect };
