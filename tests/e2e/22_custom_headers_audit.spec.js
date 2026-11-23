// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Non-Overview Header Redesign Audit (Transactions, Reports, More)', () => {
  test('1. Transactions page displays designated header and quick actions', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to Transactions
    const txTab = page.locator('nav button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txTab.click();
    await page.waitForTimeout(500);

    // Verify Title and Subtitle in Header
    const headerTitle = page.locator('header h1:has-text("Transactions")');
    await expect(headerTitle).toBeVisible();

    const headerSubtitle = page.locator('header h2:has-text("Expense records & history")');
    await expect(headerSubtitle).toBeVisible();

    // Verify Theme Switcher and Avatar with indicator dot
    const themeBtn = page.locator('header button[aria-label="Toggle Theme"]');
    await expect(themeBtn).toBeVisible();

    const avatarBtn = page.locator('header button[aria-label="Profile and Settings"]');
    await expect(avatarBtn).toBeVisible();
    await expect(avatarBtn).toContainText('R');

    // Verify 3 Action Buttons below: Import, Excel/Sheets, Download
    const importBtn = page.locator('header button[aria-label="Import Expenses"]');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import');

    const excelBtn = page.locator('header button[aria-label="Export to Excel"]');
    await expect(excelBtn).toBeVisible();

    const downloadBtn = page.locator('header button[aria-label="Download Backup"]');
    await expect(downloadBtn).toBeVisible();

    // Verify summary strip
    const summaryStrip = page.locator('span').filter({ hasText: /entries found/i }).first();
    await expect(summaryStrip).toBeVisible();

    // Take verification screenshot of Transactions Header
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_transactions.png' });
    await page.locator('header').first().screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_transactions_cropped.png' });
  });

  test('2. Reports page displays designated header with 4-tab capsule navigation', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to Reports
    const repTab = page.locator('nav button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await repTab.click();
    await page.waitForTimeout(500);

    // Verify Title and Subtitle
    const headerTitle = page.locator('header h1:has-text("Reports")');
    await expect(headerTitle).toBeVisible();

    const headerSubtitle = page.locator('header h2:has-text("Spending & expense analytics")');
    await expect(headerSubtitle).toBeVisible();

    // Verify 4-pill capsule tabs
    const overviewPill = page.locator('header button:has-text("Overview")');
    const categoriesPill = page.locator('header button:has-text("Categories")');
    const paymentPill = page.locator('header button:has-text("Payment Modes")');
    const yearlyPill = page.locator('header button:has-text("Yearly")');

    await expect(overviewPill).toBeVisible();
    await expect(categoriesPill).toBeVisible();
    await expect(paymentPill).toBeVisible();
    await expect(yearlyPill).toBeVisible();

    // Overview is active by default (matching user's reference mockup)
    await expect(overviewPill).toHaveClass(/bg-\[#6C47FF\]/);

    // Take verification screenshot of Reports Header (Overview active)
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_reports.png' });
    await page.locator('header').first().screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_reports_cropped.png' });

    // Switch to Categories pill
    await categoriesPill.click();
    await page.waitForTimeout(400);
    await expect(categoriesPill).toHaveClass(/bg-\[#6C47FF\]/);

    // Switch to Payment Modes pill
    await paymentPill.click();
    await page.waitForTimeout(400);
    await expect(paymentPill).toHaveClass(/bg-\[#6C47FF\]/);
  });

  test('3. More page displays designated header with pill search capsule', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More
    const moreTab = page.locator('nav button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Verify Title and Subtitle
    const headerTitle = page.locator('header h1:has-text("More")');
    await expect(headerTitle).toBeVisible();

    const headerSubtitle = page.locator('header h2:has-text("Settings, data management and preferences")');
    await expect(headerSubtitle).toBeVisible();

    // Verify Search capsule inside header
    const searchInput = page.locator('header input[placeholder*="Search settings"]');
    await expect(searchInput).toBeVisible();

    // Filter by typing 'budget'
    await searchInput.fill('budget');
    await page.waitForTimeout(400);

    const matchingSection = page.locator('text=/Matching Settings/i').first();
    await expect(matchingSection).toBeVisible();

    // Clear search using clear button inside header
    const clearBtn = page.locator('header button[aria-label="Clear Search"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(400);
    await expect(matchingSection).toHaveCount(0);

    // Take verification screenshot of More Header
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_more.png' });
    await page.locator('header').first().screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_header_more_cropped.png' });
  });
});
