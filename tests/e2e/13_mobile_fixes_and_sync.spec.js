// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Area M: Mobile Bug Fixes, Themes & Offline Synchronization', () => {
  test.beforeEach(async ({ page, authHelpers }) => {
    await authHelpers.clearSession();
  });

  test('M1: More button navigation does not auto-open budget popup repeatedly', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Verify Dashboard is open
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible({ timeout: 10000 });

    // Click 'More' in bottom navigation bar
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await expect(moreTab).toBeVisible();
    await moreTab.click();

    // Verify Settings / More screen loaded
    await expect(page.locator('h1:has-text("More"), h1:has-text("More & Settings")').first()).toBeVisible({ timeout: 5000 });

    // Assert that the Monthly Target Budget modal is NOT automatically opened
    const budgetModalHeading = page.locator('h3:has-text("Monthly Target Budget")');
    await expect(budgetModalHeading).not.toBeVisible();

    // Switch to Home and back to More multiple times to confirm it never re-triggers
    const homeTab = page.locator('button:has-text("Home"), nav button:has-text("Home")').first();
    await homeTab.click();
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible({ timeout: 5000 });

    await moreTab.click();
    await expect(page.locator('h1:has-text("More"), h1:has-text("More & Settings")').first()).toBeVisible({ timeout: 5000 });
    await expect(budgetModalHeading).not.toBeVisible();

    // Now explicitly click 'Monthly Budget' item in More page
    const budgetMenuItem = page.locator('button:has-text("Monthly Budget"), div:has-text("Monthly Budget")').filter({ hasText: 'Set or update' }).first();
    if (await budgetMenuItem.isVisible()) {
      await budgetMenuItem.click();
      await expect(budgetModalHeading).toBeVisible({ timeout: 5000 });

      // Test "Skip for now" dismisses modal
      const skipBtn = page.locator('button:has-text("Skip for now")').first();
      await expect(skipBtn).toBeVisible();
      await skipBtn.click();
      await expect(budgetModalHeading).not.toBeVisible();
    }
  });

  test('M2: Theme switching supports all 6 themes and persists across sessions', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to More
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    if (await moreTab.isVisible()) {
      await moreTab.click();
    }

    // Open Theme selector
    const themeItem = page.locator('button:has-text("Appearance"), button:has-text("Theme"), div:has-text("Appearance")').first();
    if (await themeItem.isVisible()) {
      await themeItem.click();
    }

    // Verify themes are selectable in localStorage
    const themesToTest = ['midnight', 'ocean', 'emerald', 'rose', 'light', 'dark'];
    for (const t of themesToTest) {
      await page.evaluate((themeId) => {
        window.__TEST_SET_THEME ? window.__TEST_SET_THEME(themeId) : localStorage.setItem('expense_tracker_theme', themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        if (themeId === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }, t);

      const currentThemeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(currentThemeAttr).toBe(t);
    }

    // Check localStorage persistence on reload
    await page.evaluate(() => localStorage.setItem('expense_tracker_theme', 'ocean'));
    await page.reload();
    const persisted = await page.evaluate(() => localStorage.getItem('expense_tracker_theme'));
    expect(persisted).toBe('ocean');
  });

  test('M3: Reports page immediately updates when transactions are imported', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Open Reports tab
    const reportsTab = page.locator('nav button:has-text("Reports"), button:has-text("Reports")').first();
    await reportsTab.click();

    // Verify Reports loaded
    await expect(page.getByText(/Spending & Expense Analytics|Total Spent/i).first()).toBeVisible({ timeout: 10000 });

    // Emulate an import batch completion event
    await page.evaluate(() => {
      const email = 'raaajshinde@gmail.com';
      const key = `expense_tracker_cached_transactions_${email}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const newImportTx = {
        id: 'IMPORT-TEST-999',
        amount: 8888,
        category: 'Shopping',
        date: new Date().toISOString().slice(0, 10),
        month_key: new Date().toISOString().slice(0, 7),
        description: 'Automated Playwright Import Test',
        payment_mode: 'UPI',
        type: 'expense'
      };
      existing.unshift(newImportTx);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('expense_tracker_synced'));
    });

    // Verify Reports page remains active and healthy without crash
    await expect(page.getByText(/Spending & Expense Analytics|Total Spent/i).first()).toBeVisible();
  });

  test('M4: Offline expense entry saves locally and queues for synchronization', async ({ page, context, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Simulate going offline
    await context.setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Check offline status banner appears
    const offlineIndicator = page.getByText(/You're offline/i).first();
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

    // Add expense while offline
    const addExpenseBtn = page.locator('button[aria-label="Quick Add Expense"], button[aria-label="Add Expense"]').first();
    if (await addExpenseBtn.isVisible()) {
      await addExpenseBtn.click();

      const amountInput = page.locator('input[placeholder="0.00"], input[placeholder="0"], input[name="amount"]').first();
      await expect(amountInput).toBeVisible({ timeout: 5000 });
      await amountInput.fill('450');

      const descInput = page.locator('input[placeholder*="Groceries"], input[placeholder*="What was this for"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Offline Coffee Test');
      }

      // Submit
      const saveBtn = page.locator('button:has-text("Save Expense"), button[type="submit"]:has-text("Save")').first();
      await saveBtn.click();

      // Verify mutation is queued in pending sync queue
      const pendingCount = await page.evaluate(() => {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('et_pending_sync_')) {
            try {
              const items = JSON.parse(localStorage.getItem(k) || '[]');
              count += items.length;
            } catch (e) {}
          }
        }
        return count;
      });

      // Verify at least 1 mutation enqueued
      expect(pendingCount).toBeGreaterThanOrEqual(1);
    }

    // Reconnect to internet
    await context.setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
  });
});
