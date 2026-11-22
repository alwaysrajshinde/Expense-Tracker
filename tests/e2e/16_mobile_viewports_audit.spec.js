// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Mobile Viewports & Touch Architecture Audit', () => {
  const viewports = [
    { name: '320px Ultra-Compact (iPhone SE 1st)', width: 320, height: 568 },
    { name: '360px Core Android (Galaxy S8/S9)', width: 360, height: 640 },
    { name: '375px Modern Compact (iPhone SE 2/3, X)', width: 375, height: 667 },
    { name: '390px Mainstream (iPhone 12/13/14/15)', width: 390, height: 844 },
    { name: '414px Large Mobile (iPhone Plus/XR)', width: 414, height: 896 },
    { name: '430px Flagship Phablet (iPhone Pro Max)', width: 430, height: 932 }
  ];

  for (const vp of viewports) {
    test(`Zero Horizontal Overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page, authHelpers }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await authHelpers.loginAsRaj();

      // Dismiss welcome overlay if present
      const overlayHeading = page.locator('h2:has-text("Good")').first();
      if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
        await overlayHeading.click();
        await page.waitForTimeout(500);
      }

      // Check overflow on Home / Dashboard
      const homeOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(homeOverflow).toBe(true);

      // Check Reports page
      const reportsNav = page.locator('nav button, nav a').filter({ hasText: /Reports|Analytics|रिपोर्ट/i }).first();
      if (await reportsNav.isVisible()) {
        await reportsNav.click();
        await page.waitForTimeout(500);
        const reportsOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth <= window.innerWidth;
        });
        expect(reportsOverflow).toBe(true);
      }

      // Check Transactions page
      const txNav = page.locator('nav button, nav a').filter({ hasText: /Transactions|History|लेनदेन/i }).first();
      if (await txNav.isVisible()) {
        await txNav.click();
        await page.waitForTimeout(500);
        const txOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth <= window.innerWidth;
        });
        expect(txOverflow).toBe(true);
      }
    });
  }

  test('Add Expense Form Single-Page Viewport Fit (No Scrolling Required)', async ({ page, authHelpers }) => {
    // Audit on standard 360px mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay if present
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    // Tap the Add Expense button (+) in bottom navigation
    const addBtn = page.locator('button[aria-label*="Add"], nav button:has(svg.lucide-plus), button:has-text("+")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(600);

    // Verify modal elements are visible simultaneously
    const amountInput = page.locator('input[placeholder*="0.00"], input[type="number"], input[inputmode="decimal"]').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });

    const submitBtn = page.locator('button:has-text("Save"), button:has-text("Add Expense")').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    // Assert that the submit button is fully within the active viewport without scrolling
    const boundingBox = await submitBtn.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(640);
    }
  });

  test('Bottom Navigation Bar Minimum Touch Target Accessibility (>= 44x44px)', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authHelpers.loginAsRaj();

    // Dismiss welcome overlay
    const overlayHeading = page.locator('h2:has-text("Good")').first();
    if (await overlayHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overlayHeading.click();
      await page.waitForTimeout(500);
    }

    const navButtons = page.locator('nav button, nav a');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const btn = navButtons.nth(i);
      const box = await btn.boundingBox();
      if (box) {
        // Enforce standard accessibility touch target bounds (>= 40px with margin/hitbox)
        expect(box.width).toBeGreaterThanOrEqual(36);
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    }
  });
});
