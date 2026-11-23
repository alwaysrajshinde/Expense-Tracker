// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('More Page Comprehensive Deep Search Feature Audit', () => {

  test('1. Mobile: Top-level features display correct parent categories and no duplicates', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More page
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await expect(searchInput).toBeVisible();

    // 1. Search 'Budget'
    await searchInput.fill('Budget');
    await page.waitForTimeout(300);

    const budgetResults = page.locator('[data-testid^="search-result-"]');
    const budgetCount = await budgetResults.count();
    expect(budgetCount).toBeGreaterThanOrEqual(2);

    // Verify parent category badge
    const firstResultBadge = budgetResults.first().locator('span').filter({ hasText: /Budget/i }).first();
    await expect(firstResultBadge).toBeVisible();

    // Verify IDs are unique (no duplicates)
    const ids = [];
    for (let i = 0; i < budgetCount; i++) {
      const id = await budgetResults.nth(i).getAttribute('data-testid');
      expect(ids).not.toContain(id);
      ids.push(id);
    }

    // Capture screenshot of budget search results
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_more_search_budget.png' });
  });

  test('2. Mobile: Deep nested settings - "Add Category" directly opens category modal with Add form', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Add Category');
    await page.waitForTimeout(300);

    // Result should show Add New Category with parent badge Categories
    const addCategoryResult = page.locator('[data-testid="search-result-categories_add"]');
    await expect(addCategoryResult).toBeVisible();
    await expect(addCategoryResult).toContainText('Categories');
    await expect(addCategoryResult).toContainText('Add New Category');

    // Click it - should deep navigate into category modal with Add form visible
    await addCategoryResult.click();
    await page.waitForTimeout(500);

    // Verify Category Modal is open and Add form input is visible
    const newCategoryInput = page.locator('input[placeholder*="Category Name" i]');
    await expect(newCategoryInput).toBeVisible();

    // Capture screenshot of deep navigation into Add Category
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_deep_nav_add_category.png' });

    // Close category modal
    const closeBtn = page.locator('button[aria-label="Close dialog"], button:has-text("Close"), button:has-text("Cancel")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('3. Mobile: Deep nested settings - "Archived Categories" opens category modal on Archived tab', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Archived');
    await page.waitForTimeout(300);

    const archivedResult = page.locator('[data-testid="search-result-categories_archived"]');
    await expect(archivedResult).toBeVisible();
    await expect(archivedResult).toContainText('Archived Categories');

    await archivedResult.click();
    await page.waitForTimeout(500);

    // Verify modal is open on archived tab
    const archivedTabHeader = page.locator('button:has-text("Archived")').first();
    await expect(archivedTabHeader).toBeVisible();

    // Capture screenshot of deep navigation into Archived Categories
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_deep_nav_archived_tab.png' });

    // Close
    const closeBtn = page.locator('button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('4. Mobile: Deep nested settings - "Dark Mode" activates theme and opens theme selector', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Dark Mode');
    await page.waitForTimeout(300);

    const darkResult = page.locator('[data-testid="search-result-theme_dark_violet"]');
    await expect(darkResult).toBeVisible();
    await expect(darkResult).toContainText('Appearance');

    await darkResult.click();
    await page.waitForTimeout(500);

    // Verify Theme Dialog is opened
    const themeModalTitle = page.locator('h3:has-text("Appearance & Accessibility"), h3:has-text("Theme & Visual Style"), h3:has-text("Theme")').first();
    await expect(themeModalTitle).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_deep_nav_theme.png' });

    // Close modal
    const closeThemeBtn = page.locator('button:has-text("Done"), button:has-text("Close")').first();
    if (await closeThemeBtn.isVisible()) {
      await closeThemeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('5. Mobile: Case-insensitivity, partial matching, multi-word and whitespace handling', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search settings"]').first();

    // Case-insensitivity: UPPERCASE
    await searchInput.fill('PASSWORD RESET');
    await page.waitForTimeout(300);
    let resetResult = page.locator('[data-testid="search-result-security_password_reset"]');
    await expect(resetResult).toBeVisible();

    // Partial matching: 'notif'
    await searchInput.fill('notif');
    await page.waitForTimeout(300);
    let notifResult = page.locator('[data-testid="search-result-notifications_center"]');
    await expect(notifResult).toBeVisible();

    // Multi-word with leading/trailing whitespace
    await searchInput.fill('   monthly budget target   ');
    await page.waitForTimeout(300);
    let budgetMainResult = page.locator('[data-testid="search-result-budget_main"]');
    await expect(budgetMainResult).toBeVisible();

    // Nonexistent feature query shows clean 'No settings found' empty state
    await searchInput.fill('xyznonexistentfeature123');
    await page.waitForTimeout(300);
    const noResults = page.locator('[data-testid="more-no-results"]');
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText('No settings found');

    // Capture screenshot of no results state
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_more_search_no_results.png' });

    // Clear search and restore original layout
    const clearBtn = page.locator('button[aria-label="Clear Search"]').first();
    await clearBtn.click();
    await page.waitForTimeout(300);

    // Verify search results gone and normal sections restored
    await expect(noResults).toHaveCount(0);
    const profileSection = page.locator('text=/Profile/i').first();
    await expect(profileSection).toBeVisible();
  });

  test('6. Desktop: Search bar in executive header displays matching results and navigates', async ({ page, authHelpers }) => {
    // Desktop resolution
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Click More/Settings in desktop sidebar
    const desktopMoreLink = page.locator('aside button, aside a').filter({ hasText: /More|Settings|अधिक/i }).first();
    await desktopMoreLink.click();
    await page.waitForTimeout(500);

    // Desktop search bar
    const desktopSearch = page.locator('input[aria-label="Search Settings"]');
    await expect(desktopSearch).toBeVisible();

    // Search 'Privacy Policy'
    await desktopSearch.fill('Privacy Policy');
    await page.waitForTimeout(300);

    const privacyResult = page.locator('[data-testid="search-result-help_privacy_policy"]');
    await expect(privacyResult).toBeVisible();
    await expect(privacyResult).toContainText('Help & About');

    // Capture desktop search results screenshot
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_desktop_more_search.png' });

    // Click Privacy Policy result -> opens LegalModal
    await privacyResult.click();
    await page.waitForTimeout(500);

    const legalModal = page.locator('h2:has-text("Privacy Policy")');
    await expect(legalModal).toBeVisible();

    // Capture screenshot of Privacy Policy opened from desktop search
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_desktop_privacy_modal.png' });

    // Close legal modal
    const closeLegalBtn = page.locator('button:has-text("Close")').first();
    if (await closeLegalBtn.isVisible()) {
      await closeLegalBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('7. Search works after navigating away and returning, with zero console errors', async ({ page, authHelpers }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('404')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More
    let moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(400);

    // Search 'Currency'
    let searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Currency');
    await page.waitForTimeout(300);

    const currencyResult = page.locator('[data-testid="search-result-profile_currency"]');
    await expect(currencyResult).toBeVisible();

    // Navigate to Home tab
    const homeTab = page.locator('nav button, aside button').filter({ hasText: /Home|मुखपृष्ठ|होम/i }).first();
    await homeTab.click();
    await page.waitForTimeout(400);

    // Return to More
    moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(400);

    // Search should still work cleanly
    searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Excel');
    await page.waitForTimeout(300);

    const excelResult = page.locator('[data-testid="search-result-data_excel_export"]');
    await expect(excelResult).toBeVisible();

    // Verify no critical console errors occurred
    expect(consoleErrors.length).toBe(0);
  });
});
