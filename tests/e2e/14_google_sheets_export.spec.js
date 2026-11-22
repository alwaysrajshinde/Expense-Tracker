// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Area G: Google Sheets Live Integration & Direct Cloud Export', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(45000);
  });

  test('G1: Desktop & Mobile UI renders "Export to Google Sheets" in Data Management', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to More / Settings tab
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await expect(moreTab).toBeVisible({ timeout: 10000 });
    await moreTab.click();

    // Verify 'Export to Google Sheets' button is present in the UI
    const sheetsExportBtn = page.locator('button:has-text("Export to Google Sheets"), button:has-text("Google Sheets")').first();
    await expect(sheetsExportBtn).toBeVisible({ timeout: 10000 });

    // Click to open Google Sheets Export modal
    await sheetsExportBtn.click();

    // Verify modal elements
    const modalHeading = page.locator('h3:has-text("Export to Google Sheets")');
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=1. Select Export Scope')).toBeVisible();
    await expect(page.locator('text=2. Google Drive Destination')).toBeVisible();
    await expect(page.locator('text=All Transactions')).toBeVisible();
    await expect(page.locator('text=Current Month')).toBeVisible();
    await expect(page.locator('text=Specific Month')).toBeVisible();
    await expect(page.locator('text=Custom Date Range')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button:has-text("Close")').first();
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('G2: Export modal supports all 4 scopes (All, Current Month, Specific Month, Custom Date Range)', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to Settings
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await moreTab.click();

    const sheetsExportBtn = page.locator('button:has-text("Export to Google Sheets"), button:has-text("Google Sheets")').first();
    await sheetsExportBtn.click();

    // 1. All Transactions (default)
    await page.locator('button:has-text("All Transactions")').click();
    await expect(page.locator('text=Selected:')).toBeVisible();

    // 2. Specific Month
    await page.locator('button:has-text("Specific Month")').click();
    const monthSelect = page.locator('.fixed select').first();
    await expect(monthSelect).toBeVisible();

    // 3. Custom Date Range
    await page.locator('button:has-text("Custom Date Range")').click();
    const startDateInput = page.locator('input[type="date"]').first();
    await expect(startDateInput).toBeVisible();

    // 4. Current Month
    await page.locator('button:has-text("Current Month")').click();
    await expect(page.locator('text=Selected:')).toBeVisible();
  });

  test('G3: Google Sheets authorization and live export workflow creates spreadsheet and provides open link', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Enable automated mock hook in browser context
    await page.evaluate(() => {
      window.__TEST_MOCK_GOOGLE_SHEETS = true;
    });

    // Open More -> Google Sheets modal
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await moreTab.click();

    const sheetsExportBtn = page.locator('button:has-text("Export to Google Sheets"), button:has-text("Google Sheets")').first();
    await sheetsExportBtn.click();

    // Click 'Export Now'
    const exportNowBtn = page.locator('button:has-text("Export Now")').first();
    await expect(exportNowBtn).toBeVisible();
    await exportNowBtn.click();

    // Verify success banner and 'Open in Google Sheets' action appear
    const successMsg = page.locator('text=Export Successful');
    await expect(successMsg).toBeVisible({ timeout: 10000 });

    const openSheetBtn = page.locator('a:has-text("Open in Google Sheets")');
    await expect(openSheetBtn).toBeVisible();
    const href = await openSheetBtn.getAttribute('href');
    expect(href).toContain('docs.google.com/spreadsheets/d/');

    // Verify spreadsheet metadata is saved for updates on subsequent exports
    const savedConfig = await page.evaluate(() => {
      let cfg = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('et_gsheets_config_')) {
          cfg = JSON.parse(localStorage.getItem(k) || '{}');
          break;
        }
      }
      return cfg;
    });

    expect(savedConfig).not.toBeNull();
    expect(savedConfig.spreadsheetId).toBeTruthy();
  });

  test('G4: Subsequent export provides "Update Connected Spreadsheet" option', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Pre-populate connected spreadsheet configuration
    await page.evaluate(() => {
      window.__TEST_MOCK_GOOGLE_SHEETS = true;
      localStorage.setItem('et_gsheets_config_default_user', JSON.stringify({
        spreadsheetId: 'existing_connected_sheet_123',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/existing_connected_sheet_123/edit',
        title: 'Expense Tracker - Connected Ledger',
        lastExportedAt: new Date().toISOString(),
        lastExportCount: 1216
      }));
    });

    // Open More -> Google Sheets
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await moreTab.click();

    const sheetsExportBtn = page.locator('button:has-text("Export to Google Sheets"), button:has-text("Google Sheets")').first();
    await sheetsExportBtn.click();

    // Verify 'Update Connected Spreadsheet' radio option is pre-selected
    await expect(page.locator('text=Update Connected Spreadsheet')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Create Brand New Spreadsheet')).toBeVisible();

    // Trigger update export
    const exportNowBtn = page.locator('button:has-text("Export Now")').first();
    await exportNowBtn.click();

    // Verify successful update
    await expect(page.locator('text=Export Successful')).toBeVisible({ timeout: 10000 });
  });

  test('G5: Offline mode prevents Google Sheets export and displays clear warning', async ({ page, context, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Open More -> Google Sheets
    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await moreTab.click();

    const sheetsExportBtn = page.locator('button:has-text("Export to Google Sheets"), button:has-text("Google Sheets")').first();
    await sheetsExportBtn.click();

    // Set browser offline
    await context.setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Verify offline warning appears in modal
    await expect(page.getByText(/Google Sheets export requires an active internet connection|Offline/i).first()).toBeVisible({ timeout: 5000 });

    // Verify Export Now button is disabled
    const exportNowBtn = page.locator('button:has-text("Export Now")').first();
    const isDisabled = await exportNowBtn.isDisabled();
    expect(isDisabled).toBe(true);

    // Reconnect to internet
    await context.setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
  });

  test('G6: Existing Excel (.xlsx) and JSON backup exports remain intact', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    const moreTab = page.locator('button:has-text("More"), nav button:has-text("More")').first();
    await moreTab.click();

    // On mobile, click "Export Transactions" row to open export modal
    const exportRowBtn = page.locator('button:has-text("Export Transactions")').first();
    if (await exportRowBtn.isVisible()) {
      await exportRowBtn.click();
    }

    // Verify Excel and JSON buttons exist
    const excelBtn = page.locator('button:has-text("Excel (.xlsx)"), button:has-text("Excel Spreadsheet")').first();
    await expect(excelBtn).toBeVisible({ timeout: 5000 });

    const jsonBtn = page.locator('button:has-text("JSON Backup"), button:has-text("Full JSON Data Backup")').first();
    await expect(jsonBtn).toBeVisible({ timeout: 5000 });
  });
});
