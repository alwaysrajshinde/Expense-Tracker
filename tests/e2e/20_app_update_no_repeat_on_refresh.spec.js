// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test('App update toast does not re-appear on page refresh', async ({ page, authHelpers }) => {
  await page.setViewportSize({ width: 393, height: 851 });

  // 1. First visit with new version already recorded as notified
  await page.addInitScript(() => {
    localStorage.setItem('expense_tracker_update_toast_version', '2.4.2');
  });

  // 2. Login
  await authHelpers.loginAsRaj();
  await page.waitForTimeout(1000);

  // 3. Assert NO update toast exists on initial load
  const updateToastInitial = page.locator('div').filter({ hasText: /App updated to/i });
  await expect(updateToastInitial).toHaveCount(0);

  // 4. Reload page (simulate user refresh)
  await page.reload();
  await page.waitForTimeout(4500); // Wait beyond the 3500ms timer

  // 5. Assert STILL NO update toast appears after refresh!
  const updateToastAfterRefresh = page.locator('div').filter({ hasText: /App updated to/i });
  await expect(updateToastAfterRefresh).toHaveCount(0);
});
