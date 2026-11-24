// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area 34: iOS PWA Installation & Mobile Modal Containment Audit', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('34.1: iOS User-Agent triggers iOS PWA instructions with Share & Add to Home Screen', async ({ page, authHelpers }) => {
    // Emulate iPhone Safari user agent and mobile viewport
    await page.setViewportSize({ width: 393, height: 852 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
      });
    });

    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More tab
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Click Install App action item
    const installItem = page.locator('[data-testid="mobile-install-pwa-btn"]');
    await installItem.scrollIntoViewIfNeeded();
    await expect(installItem).toBeVisible();
    await installItem.click();
    await page.waitForTimeout(400);

    // Verify InstallModal is portaled to document.body
    const modal = page.locator('[data-testid="install-app-modal"]');
    await expect(modal).toBeVisible();

    // Verify iOS-specific instructions
    await expect(modal.locator('text=Apple iOS Installation')).toBeVisible();
    await expect(modal.locator('text=Tap the Share Button').first()).toBeVisible();
    await expect(modal.locator('text=Add to Home Screen').first()).toBeVisible();

    // Verify iOS Chrome / Safari advice is visible
    await expect(modal.locator('text=Using Chrome on iPhone?')).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('button:has-text("Got It")').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(modal).toHaveCount(0);
  });

  test('34.2: Search in More tab finds "Install App" via "ios", "pwa", and "safari"', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();

    // 1. Search "ios"
    await searchInput.fill('ios');
    await page.waitForTimeout(300);
    const searchResultIos = page.locator('text=Install PocketNook App').first();
    await expect(searchResultIos).toBeVisible();

    // 2. Search "safari"
    await searchInput.fill('safari');
    await page.waitForTimeout(300);
    const searchResultSafari = page.locator('text=Install PocketNook App').first();
    await expect(searchResultSafari).toBeVisible();

    // 3. Search "pwa"
    await searchInput.fill('pwa');
    await page.waitForTimeout(300);
    const searchResultPwa = page.locator('text=Install PocketNook App').first();
    await expect(searchResultPwa).toBeVisible();

    // Clicking search result opens the InstallModal directly
    await searchResultPwa.click();
    await page.waitForTimeout(400);

    const modal = page.locator('[data-testid="install-app-modal"]');
    await expect(modal).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('button:has-text("Got It")').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(modal).toHaveCount(0);
  });

  test('34.3: Mobile Sub-Modals Portaling & Centering Audit (Zero scroll jumps)', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Sub-modal triggers to verify with exact titles
    const testModals = [
      { triggerText: 'Monthly Budget' },
      { triggerText: 'Categories' },
      { triggerText: 'Appearance & Accessibility' },
      { triggerText: 'App Font Size' },
      { triggerText: 'Export Transactions' },
      { triggerText: 'Security' },
      { triggerText: 'Help & Support' },
      { triggerText: 'Install App (iOS & Android)' }
    ];

    for (const item of testModals) {
      // Find trigger button
      const trigger = page.locator(`button:has-text("${item.triggerText}"), div[role="button"]:has-text("${item.triggerText}")`).first();
      await trigger.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);

      const scrollYBefore = await page.evaluate(() => window.scrollY);

      // Click trigger
      await trigger.click();
      await page.waitForTimeout(400);

      // Find open modal card
      const modalCard = page.locator('div.fixed.inset-0.z-50').first();
      await expect(modalCard).toBeVisible();

      // Verify scroll position did not jump wildly
      const scrollYAfter = await page.evaluate(() => window.scrollY);
      expect(Math.abs(scrollYAfter - scrollYBefore)).toBeLessThan(50);

      // Close modal (via close button or Escape key)
      const closeBtn = page.locator('div.fixed.inset-0.z-50 button[aria-label*="Close"], div.fixed.inset-0.z-50 button:has-text("Done"), div.fixed.inset-0.z-50 button:has-text("Close"), div.fixed.inset-0.z-50 button:has-text("Cancel"), div.fixed.inset-0.z-50 button:has-text("Got It")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(300);

      // Verify modal unmounted cleanly
      await expect(page.locator('div.fixed.inset-0.z-50')).toHaveCount(0);
    }
  });

  test('34.4: Desktop layout presents Install App card with responsive guidance', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const settingsBtn = page.locator('aside button, nav button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await settingsBtn.click();
    await page.waitForTimeout(500);

    const installCardBtn = page.locator('[data-testid="desktop-install-pwa-btn"]');
    await installCardBtn.scrollIntoViewIfNeeded();
    await expect(installCardBtn).toBeVisible();
    await installCardBtn.click();
    await page.waitForTimeout(400);

    const modal = page.locator('[data-testid="install-app-modal"]');
    await expect(modal).toBeVisible();

    // Verify modal has clean close button
    const closeBtn = modal.locator('button:has-text("Got It")').first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(modal).toHaveCount(0);
  });
});
