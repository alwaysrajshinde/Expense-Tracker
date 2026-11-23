// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Route Persistence & Refresh Audit (BUG-MOB-32 / DEF-031)', () => {
  test.beforeEach(async ({ authHelpers }) => {
    // Start with a clean authenticated session for Raj
    await authHelpers.loginAsRaj();
  });

  test('1. Page Refresh on All Main Pages keeps exact page active', async ({ page }) => {
    // --- Overview Page ---
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible({ timeout: 10000 });
    await page.reload();
    await page.waitForTimeout(600);
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();
    expect(page.url()).toMatch(/#\/(overview|home)?/);

    // --- Transactions Page ---
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();
    expect(page.url()).toContain('#/transactions');

    // REFRESH on Transactions
    await page.reload();
    await page.waitForTimeout(600);
    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // --- Reports Page ---
    const reportsNavBtn = page.locator('nav button, aside button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await reportsNavBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();
    expect(page.url()).toContain('#/reports');

    // REFRESH on Reports
    await page.reload();
    await page.waitForTimeout(600);
    expect(page.url()).toContain('#/reports');
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();

    // --- More Page ---
    const moreNavBtn = page.locator('nav button, aside button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await moreNavBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h1, h2').filter({ hasText: /More|Settings/i }).first()).toBeVisible();
    expect(page.url()).toMatch(/#\/(more|settings)/);

    // REFRESH on More
    await page.reload();
    await page.waitForTimeout(600);
    expect(page.url()).toMatch(/#\/(more|settings)/);
    await expect(page.locator('h1, h2').filter({ hasText: /More|Settings/i }).first()).toBeVisible();
  });

  test('2. Page Refresh on Nested Settings Routes (Budget, Categories, Sub-Tabs)', async ({ page }) => {
    // --- Direct Access & Refresh on Budget Settings ---
    await page.goto('/#/settings/budget');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/budget');
    // Verify Monthly Budget element is visible
    const budgetElement = page.locator('text=/Monthly Budget/i').first();
    await expect(budgetElement).toBeVisible({ timeout: 8000 });

    // REFRESH on Budget Settings
    await page.reload();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/budget');
    await expect(page.locator('text=/Monthly Budget/i').first()).toBeVisible({ timeout: 8000 });

    // --- Direct Access & Refresh on Categories ---
    await page.goto('/#/settings/categories');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/categories');
    const catElement = page.locator('text=/Categor/i').first();
    await expect(catElement).toBeVisible({ timeout: 8000 });

    // REFRESH on Categories
    await page.reload();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/categories');
    await expect(page.locator('text=/Categor/i').first()).toBeVisible({ timeout: 8000 });

    // --- Reports Sub-Tab Persistence ---
    await page.goto('/#/reports?tab=category');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/reports?tab=category');
    // Reports page should reflect categories sub-tab
    expect(page.url()).toContain('tab=category');
  });

  test('3. Browser History Back and Forward Navigation with state sync', async ({ page }) => {
    // 1. Home
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();

    // 2. Navigate to Transactions
    await page.locator('nav button, aside button').filter({ hasText: /Transactions/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // 3. Navigate to Reports
    await page.locator('nav button, aside button').filter({ hasText: /Reports/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();

    // 4. Navigate to More
    await page.locator('nav button, aside button').filter({ hasText: /More|Settings/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('h1, h2').filter({ hasText: /More|Settings/i }).first()).toBeVisible();

    // 5. Browser Back -> Reports
    await page.goBack();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#/reports');
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();

    // 6. Browser Back -> Transactions
    await page.goBack();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // 7. Browser Back -> Home (Overview)
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();

    // 8. Browser Forward -> Transactions
    await page.goForward();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // 9. Browser Forward -> Reports
    await page.goForward();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#/reports');
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();

    // 10. REFRESH after navigating
    await page.reload();
    await page.waitForTimeout(600);
    expect(page.url()).toContain('#/reports');
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();
  });

  test('4. Direct URL Access & Desktop Navigation', async ({ page }) => {
    await page.goto('/#/transactions');
    await page.waitForTimeout(800);

    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // REFRESH on transactions
    await page.reload();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // Direct access to categories
    await page.goto('/#/settings/categories');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/categories');

    // REFRESH on categories
    await page.reload();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/settings/categories');
  });

  test('5. Invalid Route Fallback displays friendly 404 instead of silent redirect', async ({ page }) => {
    await page.goto('/#/nonexistent-route-xyz');
    await page.waitForTimeout(800);

    // Verify 404 Fallback view
    const notFoundCard = page.locator('[data-testid="not-found-container"]');
    await expect(notFoundCard).toBeVisible();
    await expect(notFoundCard).toContainText('Page Not Found');

    // Click "Go to Overview"
    const goHomeBtn = page.locator('[data-testid="not-found-home-btn"]');
    await goHomeBtn.click();
    await page.waitForTimeout(600);

    // Verify redirected to Overview
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();
    expect(page.url()).toContain('#/overview');
  });
});

test.describe('Unauthenticated Protected Route Restoration Audit', () => {
  test('6. Unauthenticated protected access saves route and restores it after login', async ({ page }) => {
    // Clear any existing session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Unauthenticated user attempts direct access to Transactions
    await page.goto('/#/transactions');
    await page.waitForTimeout(800);

    // User is shown Sign In
    const vaultBtn = page.locator('button:has-text("Sign In to Vault"), button:has-text("Sign In")').first();
    await expect(vaultBtn).toBeVisible({ timeout: 10000 });
    await vaultBtn.click();
    await page.waitForTimeout(400);

    // Ensure email input is visible and fill credentials for Raj
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('raaajshinde@gmail.com');
    await page.locator('input[type="password"]').first().fill('Password123!');
    await page.locator('button[type="submit"]:has-text("Sign In")').first().click();

    // After login, user is restored directly to Transactions!
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('#/transactions');
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
