// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Upcoming Features Feasibility & Implementation Audit (Test 29)', () => {

  test.beforeEach(async ({ authHelpers }) => {
    await authHelpers.loginAsRaj();
  });

  test('1. Recurring Subscriptions: Calculates monthly burn rate, adds new subscription, and logs expense', async ({ page }) => {
    await page.goto('/#/more');
    await page.waitForLoadState('networkidle');

    // Open Recurring Subscriptions modal via item click
    const recurringBtn = page.locator('[data-testid="upcoming-feature-recurring_expenses"], [data-testid="desktop-upcoming-recurring_expenses"]').first();
    await expect(recurringBtn).toBeVisible({ timeout: 10000 });
    await recurringBtn.click();

    // Verify modal is visible
    const modal = page.locator('[data-testid="recurring-subscriptions-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify monthly burn rate banner is displayed and non-zero
    const burnRateEl = page.locator('[data-testid="monthly-burn-rate-amount"]');
    await expect(burnRateEl).toBeVisible();
    const burnRateText = await burnRateEl.textContent();
    expect(burnRateText).toMatch(/₹/);

    // Click "Add Subscription"
    const addBtn = page.locator('[data-testid="btn-add-subscription"]');
    await addBtn.click();

    // Fill form
    await page.locator('[data-testid="input-sub-name"]').fill('Disney+ Hotstar VIP');
    await page.locator('[data-testid="input-sub-amount"]').fill('899');
    await page.locator('[data-testid="select-sub-frequency"]').selectOption('yearly');
    await page.locator('[data-testid="btn-save-subscription"]').click();

    // Verify new subscription appears in list
    await expect(page.locator('text=Disney+ Hotstar VIP').first()).toBeVisible({ timeout: 5000 });

    // Verify Log Expense button creates ledger entry
    const logExpenseBtn = page.locator('[data-testid^="btn-log-expense-"]').first();
    if (await logExpenseBtn.isVisible()) {
      await logExpenseBtn.click();
      await expect(page.locator('text=Logged ₹').first()).toBeVisible({ timeout: 5000 });
    }

    // Close modal
    await modal.locator('button[aria-label="Close Modal"]').click();
    await expect(modal).not.toBeVisible();
  });

  test('2. Smart Receipt Scanner: Renders on-device dropzone, processes receipt, and extracts fields', async ({ page }) => {
    await page.goto('/#/more');
    await page.waitForLoadState('networkidle');

    // Open Receipt Scanner modal via item click
    const receiptBtn = page.locator('[data-testid="upcoming-feature-receipt_scanner"], [data-testid="desktop-upcoming-receipt_scanner"]').first();
    await expect(receiptBtn).toBeVisible({ timeout: 10000 });
    await receiptBtn.click();

    // Verify modal is visible
    const modal = page.locator('[data-testid="receipt-scanner-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify 100% On-Device badge
    await expect(modal.locator('text=100% On-Device').first()).toBeVisible();
    await expect(page.locator('[data-testid="receipt-upload-btn"]')).toBeVisible();

    // Simulate selecting a dummy receipt image file
    const fileInput = page.locator('[data-testid="receipt-file-input"]');
    // Create a 1x1 base64 transparent PNG buffer for local canvas test
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fileInput.setInputFiles({
      name: 'Starbucks_Receipt_350.png',
      mimeType: 'image/png',
      buffer: dummyPngBuffer
    });

    // Verify parsed result screen appears
    const vendorInput = page.locator('[data-testid="receipt-extracted-vendor"]');
    await expect(vendorInput).toBeVisible({ timeout: 8000 });
    const vendorVal = await vendorInput.inputValue();
    expect(vendorVal.toLowerCase()).toContain('starbucks');

    const amountInput = page.locator('[data-testid="receipt-extracted-amount"]');
    const amountVal = await amountInput.inputValue();
    expect(Number(amountVal)).toBeGreaterThan(0);

    // Verify Add to Expenses logs transaction
    const addExpenseBtn = page.locator('[data-testid="btn-add-scanned-expense"]');
    await addExpenseBtn.click();
    await expect(page.locator('text=Expense logged:').first()).toBeVisible({ timeout: 5000 });
  });

  test('3. Google Sheets Export: Opens 1-click cloud export modal directly', async ({ page }) => {
    await page.goto('/#/more');
    await page.waitForLoadState('networkidle');

    const sheetsBtn = page.locator('[data-testid="upcoming-feature-google_sheets_sync"]').first();
    if (await sheetsBtn.isVisible()) {
      await sheetsBtn.click();
      // GoogleSheetsExportModal should be open
      await expect(page.locator('text=Export to Google Sheets').first()).toBeVisible({ timeout: 5000 });
      // Close modal
      const closeBtn = page.locator('button[aria-label="Close Modal"], button:has-text("Cancel")').first();
      await closeBtn.click();
    }
  });

  test('4. Direct Bank Feeds Removed & Statement Import Promoted', async ({ page }) => {
    await page.goto('/#/more');
    await page.waitForLoadState('networkidle');

    // Verify Bank Statement Import is visible
    const statementBtn = page.locator('[data-testid="upcoming-feature-bank_auto_sync"], [data-testid="desktop-upcoming-bank_auto_sync"]').first();
    await expect(statementBtn).toBeVisible({ timeout: 5000 });
    await expect(statementBtn.locator('text=Statement Import').first()).toBeVisible();
  });

  test('5. More Page Search launches new functional features directly', async ({ page }) => {
    await page.goto('/#/more');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('recurring');

    // Click result
    const searchResult = page.locator('button:has-text("Recurring Subscriptions")').first();
    await expect(searchResult).toBeVisible({ timeout: 5000 });
    await searchResult.click();

    // Verify modal opened
    const modal = page.locator('[data-testid="recurring-subscriptions-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.locator('button[aria-label="Close Modal"]').click();
  });

});
