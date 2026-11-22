// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Latest UI/UX & Data Improvements Audit', () => {
  test('1. Landing page header has 0 duplicate auth buttons and 0 November Budget preview', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForTimeout(600);

    // Header should NOT have Sign In or Get Started buttons
    const headerAuthButtons = page.locator('header button').filter({ hasText: /Sign In|Get Started/i });
    await expect(headerAuthButtons).toHaveCount(0);

    // Landing page should NOT show November Budget mock card
    const novemberBudget = page.locator('text="November Budget"');
    await expect(novemberBudget).toHaveCount(0);
  });

  test('2. Description input placeholder has relatable everyday items', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Open Add Expense modal
    const fabButton = page.locator('button[aria-label="Quick Add Expense"]').first();
    await fabButton.click();
    await page.waitForTimeout(500);

    // Check placeholder on description input
    const descInput = page.locator('input[placeholder*="Grocery"]');
    await expect(descInput).toBeVisible();

    // Verify it is NOT "Lunch with colleagues" or "Lunch with team"
    const oldPlaceholderInput = page.locator('input[placeholder*="colleagues"], input[placeholder*="team"]');
    await expect(oldPlaceholderInput).toHaveCount(0);
  });

  test('3. More page has quick search bar that filters settings', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Go to More page
    const moreTab = page.locator('nav button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Search bar should be visible
    const searchInput = page.locator('input[placeholder*="Search settings"]');
    await expect(searchInput).toBeVisible();

    // Type "budget"
    await searchInput.fill('budget');
    await page.waitForTimeout(400);

    // Matching settings section appears
    const matchingSection = page.locator('text=/Matching Settings/i').first();
    await expect(matchingSection).toBeVisible();

    // Clear search
    const clearBtn = page.locator('button').filter({ hasText: /Clear search/i }).first();
    await clearBtn.click();
    await page.waitForTimeout(400);
    await expect(matchingSection).toHaveCount(0);
  });
});
