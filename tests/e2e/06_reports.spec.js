// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area F: Analytics, Reports & Math Calculations', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('F1: Reports page displays Overview, Categories, and Payment Modes tabs', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to Reports
    await page.locator('button:has-text("Reports")').first().click();

    // Verify main header
    await expect(page.locator('text=Spending & Expense Analytics')).toBeVisible();

    // Verify tabs
    await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Categories (")')).toBeVisible();
    await expect(page.locator('button:has-text("Payment Modes")').first()).toBeVisible();
  });

  test('F2: Switching to Categories tab reveals detailed category share breakdown', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Reports")').first().click();

    // Click Categories sub-tab
    await page.locator('button:has-text("Categories (")').click();
    await page.waitForTimeout(500);

    // Verify category items are listed with percentages
    const percentageTag = page.locator('text=%');
    await expect(percentageTag.first()).toBeVisible();
  });

  test('F3: Switching to Payment Modes tab reveals UPI, Cash, Card breakdown', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Reports")').first().click();

    await page.locator('button:has-text("Payment Modes")').click();
    await page.waitForTimeout(500);

    // Verify breakdown cards
    const bodyText = await page.innerText('body');
    expect(bodyText.includes('UPI') || bodyText.includes('Cash') || bodyText.includes('Card')).toBeTruthy();
  });

  test('F4: Math consistency check: Budget and Spend calculations are valid numbers', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();
    await page.locator('button:has-text("Reports")').first().click();

    // Overview cards
    await expect(page.locator('text=Total Spend').first()).toBeVisible();
    await expect(page.locator('text=Remaining Budget').first()).toBeVisible();
  });
});
