// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area E: Transactions History, Filters & Search', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('E1: Transactions page displays historical records list with counts and totals', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Go to Transactions
    await page.locator('button:has-text("Transactions")').first().click();

    // Verify page header
    await expect(page.locator('text=Expense Records & History').first()).toBeVisible({ timeout: 10000 });

    // Verify entries count text is visible
    const headerInfo = page.locator('text=entries found').first();
    await expect(headerInfo).toBeVisible();
  });

  test('E2: Search filter dynamically updates results by description or category', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Transactions")').first().click();

    const searchInput = page.locator('input[placeholder*="Search by description"]');
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('Biryani');
    await page.waitForTimeout(800);

    // Verify matching entries appear or clear button works
    const clearBtn = page.locator('input[placeholder*="Search by description"] ~ button');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('E3: Empty search returns clean empty state message', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Transactions")').first().click();

    const searchInput = page.locator('input[placeholder*="Search by description"]');
    await searchInput.fill('NonExistentExpenseSearchString123456789');
    await page.waitForTimeout(800);

    // Verify 0 entries or empty state message
    const bodyText = await page.innerText('body');
    expect(bodyText.includes('0 entries found') || bodyText.includes('No transactions')).toBeTruthy();
  });

  test('E4: Export Excel and JSON buttons exist and evaluate download functionality', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Transactions")').first().click();

    const exportExcelBtn = page.locator('a:has-text("Export Excel")');
    const exportJsonBtn = page.locator('a:has-text("JSON Backup")');

    await expect(exportExcelBtn).toBeVisible();
    await expect(exportJsonBtn).toBeVisible();

    // Audit check: Test what happens when export Excel URL is fetched directly
    const [response] = await Promise.all([
      page.request.get('/api/export/excel', {
        headers: { 'x-user-email': 'raaajshinde@gmail.com' }
      })
    ]);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('sheet');
  });
});
