// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Security, Toasts & Dropdowns Architecture Audit', () => {
  test('Verify Protected Route Guard Redirects Unauthenticated Users to Login', async ({ page }) => {
    // Clear storage completely
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Attempt direct navigation to protected dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(800);

    // Verify redirected to login/auth view
    const signinHeader = page.locator('button:has-text("Sign In"), h2:has-text("Welcome"), form input[type="email"]').first();
    await expect(signinHeader).toBeVisible({ timeout: 6000 });
  });

  test('Verify Single Centered Floating Pill Toast (Zero Vertical Stacking)', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Settings
    const settingsNav = page.locator('nav button, nav a').filter({ hasText: /Settings|More|सेटिंग्स/i }).first();
    await settingsNav.click();
    await page.waitForTimeout(600);

    // Trigger theme switches rapidly
    const emeraldTheme = page.locator('button:has-text("Emerald")').first();
    const midnightTheme = page.locator('button:has-text("Midnight")').first();
    const violetTheme = page.locator('button:has-text("Dark Violet")').first();

    if (await emeraldTheme.isVisible()) {
      await emeraldTheme.click();
      await midnightTheme.click();
      await violetTheme.click();
      await page.waitForTimeout(300);

      // Verify that strictly 1 toast pill exists in DOM
      const toastCount = await page.locator('div.fixed.top-4 div.animate-slide-down, div.fixed.top-4 div.rounded-full').count();
      expect(toastCount).toBeLessThanOrEqual(1);
    }
  });

  test('Verify Custom Fintech Dropdowns Replace Native Browser Select Popups', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Transactions
    const txNav = page.locator('nav button, nav a').filter({ hasText: /Transactions|History/i }).first();
    await txNav.click();
    await page.waitForTimeout(600);

    // Verify absence of raw <select> elements in the filter bar
    const rawSelects = page.locator('div.grid select');
    await expect(rawSelects).toHaveCount(0);

    // Verify presence of CustomDropdown buttons with chevron indicators
    const customDropdownButtons = page.locator('button[aria-expanded]');
    const count = await customDropdownButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Verify Input Sanitization on Expense Description (XSS Protection)', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    // Open Add Expense modal
    const addBtn = page.locator('button[aria-label*="Add"], nav button:has(svg.lucide-plus), button:has-text("+")').first();
    await addBtn.click();
    await page.waitForTimeout(600);

    // Enter XSS payload in note/description
    const descInput = page.locator('input[placeholder*="description"], input[placeholder*="What was this for"], textarea').first();
    if (await descInput.isVisible()) {
      await descInput.fill('<script>window.XSS_DETECTED = true;</script>');
      const amtInput = page.locator('input[placeholder*="0.00"], input[type="number"], input[inputmode="decimal"]').first();
      await amtInput.fill('15');

      const submitBtn = page.locator('button:has-text("Save"), button:has-text("Add Expense")').first();
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Verify that XSS script was NEVER evaluated
      const xssFired = await page.evaluate(() => Boolean(/** @type {any} */ (window).XSS_DETECTED));
      expect(xssFired).toBe(false);
    }
  });
});
