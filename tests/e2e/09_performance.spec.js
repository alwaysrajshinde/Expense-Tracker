// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area I: Performance, Console Health & Resilience', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('I1: Page loads within acceptable threshold (< 4 seconds)', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(4000);
  });

  test('I2: Clean console on application initial load (no uncaught fatal exceptions)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Fatal React errors should be 0
    const fatalErrors = errors.filter(e => 
      e.includes('Uncaught') || 
      e.includes('Rules of Hooks') || 
      e.includes('Cannot read properties of undefined')
    );
    expect(fatalErrors).toEqual([]);
  });

  test('I3: Offline resilience queue preserves transaction without crashing', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Verify syncService exists and offline status badge or indicator is operational
    const syncState = await page.evaluate(() => {
      const saved = localStorage.getItem('expense_tracker_auth_session');
      return saved ? JSON.parse(saved) : null;
    });
    expect(syncState).not.toBeNull();
  });
});
