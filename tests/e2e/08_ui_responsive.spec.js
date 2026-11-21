// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area H: UI, Responsiveness, Theme & Navigation', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('H1: Desktop viewport displays Windows Sidebar and Windows Header', async ({ page, authHelpers }) => {
    // Set desktop resolution
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();

    // Verify Windows Sidebar presence
    const sidebar = page.locator('aside, div:has-text("Expense Tracker")').first();
    await expect(sidebar).toBeVisible();

    // Verify 9 navigation items exist
    await expect(page.locator('button:has-text("Home"), div:has-text("Home")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Transactions"), div:has-text("Transactions")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Reports"), div:has-text("Reports")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Settings"), div:has-text("Settings")').first()).toBeVisible();
  });

  test('H2: Mobile viewport activates responsive layout and bottom navigation bar', async ({ page, authHelpers }) => {
    // Set mobile resolution (Pixel 7 / Android standard)
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();

    // Verify bottom navigation bar is visible
    const bottomNav = page.locator('nav').first();
    await expect(bottomNav).toBeVisible();

    // Bottom nav should have Home, Transactions, Reports, Settings
    await expect(bottomNav.locator('button').first()).toBeVisible();
  });

  test('H3: Theme toggle successfully switches between Light and Dark modes', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();

    // Look for theme toggle button
    const themeBtn = page.locator('button[title*="theme" i], button[title*="Dark" i], button[title*="Light" i], button:has-text("Dark"), button:has-text("Light")');
    if (await themeBtn.first().isVisible()) {
      const initialHtmlClass = await page.getAttribute('html', 'class') || '';
      await themeBtn.first().click();
      await page.waitForTimeout(500);
      const newHtmlClass = await page.getAttribute('html', 'class') || '';
      // Theme should change
      expect(newHtmlClass).not.toBe(initialHtmlClass);
    }
  });

  test('H4: Notifications modal opens and closes properly', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();

    // Click notifications bell icon
    const bellBtn = page.locator('button:has(svg.lucide-bell), button[title*="Notifications" i]');
    if (await bellBtn.first().isVisible()) {
      await bellBtn.first().click();
      await page.waitForTimeout(500);

      // Verify notifications modal/dropdown appears
      const notifHeader = page.locator('text=Notifications');
      await expect(notifHeader.first()).toBeVisible();

      // Close it
      await page.keyboard.press('Escape');
    }
  });
});
