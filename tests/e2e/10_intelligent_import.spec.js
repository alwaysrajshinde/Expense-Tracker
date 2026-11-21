// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area J: Intelligent Expense Import System', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('J1: Import Wizard opens from Transactions and renders source options', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to Transactions
    await page.locator('button:has-text("Transactions")').first().click();
    await expect(page.locator('text=Expense Records & History')).toBeVisible({ timeout: 10000 });

    // Click Import button
    const importBtn = page.locator('button:has-text("Import")').first();
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify modal appears
    await expect(page.locator('text=Intelligent Expense Import')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Choose Import Source')).toBeVisible();

    // Verify import source options
    await expect(page.locator('h4:has-text("Excel / CSV Spreadsheet")')).toBeVisible();
    await expect(page.locator('h4:has-text("Bank Statement")')).toBeVisible();
    await expect(page.locator('h4:has-text("Direct Clipboard Paste")')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('J2: Direct paste parsing, column auto-mapping and merchant classification', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Navigate to Transactions
    await page.locator('button:has-text("Transactions")').first().click();
    await expect(page.locator('text=Expense Records & History')).toBeVisible({ timeout: 10000 });

    // Open Import Modal
    await page.locator('button:has-text("Import")').first().click();
    await expect(page.locator('text=Intelligent Expense Import')).toBeVisible({ timeout: 5000 });

    // Select "Direct Clipboard Paste"
    await page.locator('h4:has-text("Direct Clipboard Paste")').click();
    await page.locator('button:has-text("Continue")').click();

    // Step 2: Paste Transaction Table
    await expect(page.locator('text=Paste Transaction Table')).toBeVisible({ timeout: 5000 });
    const textarea = page.locator('textarea[placeholder*="Paste your copied rows here"]');
    await expect(textarea).toBeVisible();

    // Paste sample bank statement rows (Tab-separated)
    const sampleStatement =
      `Date\tNarration / Description\tWithdrawal (Dr)\tDeposit (Cr)\tBalance
2026-11-15\tUPI/432109876543/SWIGGY/swiggy@icici/Order123\t450.00\t\t15200.00
2026-11-16\tPOS 402213XXXXXX1234 RELIANCE SMART BANDRA\t1250.50\t\t13949.50
2026-11-17\tACH/SALARY/ACME CORP NOV 2026\t\t65000.00\t78949.50
2026-11-18\tUPI/998877665544/TRANSFER TO SELF/raj@okhdfc\t5000.00\t\t73949.50`;

    await textarea.fill(sampleStatement);

    // Click Analyze Pasted Data
    const parseBtn = page.locator('button:has-text("Analyze Pasted Data")');
    await expect(parseBtn).toBeEnabled();
    await parseBtn.click();

    // Verify Step 3: Column Mapping
    await expect(page.locator('text=Map Spreadsheet Columns')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Separate Debit & Credit Columns")')).toBeVisible();

    // Proceed to Step 4: Preview & Clean
    const previewBtn = page.locator('button:has-text("Preview & Classify Transactions")');
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Verify Step 4: Interactive Table
    await expect(page.locator('text=Swiggy')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Reliance Smart Bandra')).toBeVisible();

    // Proceed to Step 6: Reconciliation & Confirm
    const reconBtn = page.locator('button:has-text("Proceed to Reconciliation & Confirm")');
    await expect(reconBtn).toBeVisible();
    await reconBtn.click();

    // Check that balance reconciliation card computes and displays correctly
    await expect(page.locator('text=Statement Arithmetically Reconciled')).toBeVisible({ timeout: 5000 });
  });

  test('J3: Import History and 1-Click Safe Undo modal opens from Settings', async ({ page, authHelpers }) => {
    await authHelpers.loginAsRaj();

    // Go to Settings / More
    await page.locator('aside button:has-text("More"), aside button:has-text("Settings"), nav button:has-text("More")').first().click();
    await expect(page.locator('text=Data Management').first()).toBeVisible({ timeout: 8000 });

    // Verify "Import Transactions" option exists in More screen
    const importTxBtn = page.locator('button:has-text("Import Transactions")');
    await expect(importTxBtn).toBeVisible();

    // Click Import History button
    const historyBtn = page.locator('button:has-text("Import History")').first();
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();

    // Verify Import History & Safe Undo modal renders
    await expect(page.locator('text=Import History & Safe Undo')).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('text=Import History & Safe Undo')).not.toBeVisible();
  });
});
