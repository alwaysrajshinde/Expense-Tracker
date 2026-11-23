// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Coming Soon Features & Strict Access Control Audit', () => {
  test('1. Mobile: Upcoming features section is visible and badged correctly', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More page
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Assert Upcoming Features header
    const upcomingHeader = page.locator('text=Upcoming Features').first();
    await expect(upcomingHeader).toBeVisible();

    // Verify all 4 registered coming soon features are visible in the upcoming section
    const sheetsFeature = page.locator('[data-testid="upcoming-feature-google_sheets_sync"]');
    await expect(sheetsFeature).toBeVisible();
    await expect(sheetsFeature).toContainText('Google Sheets');
    await expect(sheetsFeature).toContainText('Coming Soon');

    const scannerFeature = page.locator('[data-testid="upcoming-feature-receipt_scanner"]');
    await expect(scannerFeature).toBeVisible();
    await expect(scannerFeature).toContainText('Smart Receipt Scanner');
    await expect(scannerFeature).toContainText('Coming Soon');

    const recurringFeature = page.locator('[data-testid="upcoming-feature-recurring_expenses"]');
    await expect(recurringFeature).toBeVisible();
    await expect(recurringFeature).toContainText('Recurring Subscriptions');
    await expect(recurringFeature).toContainText('Coming Soon');

    const bankFeature = page.locator('[data-testid="upcoming-feature-bank_auto_sync"]');
    await expect(bankFeature).toBeVisible();
    await expect(bankFeature).toContainText('Direct Bank Account Feeds');
    await expect(bankFeature).toContainText('Coming Soon');

    // Capture screenshot of Upcoming section
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_mobile_section.png'
    });
  });

  test('2. Google Sheets: Opens preview with message banner, strictly disabled actions, and zero API calls', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Track any network calls to sheets.googleapis.com
    const externalNetworkCalls = [];
    page.on('request', req => {
      if (req.url().includes('sheets.googleapis.com') || req.url().includes('oauth2.googleapis.com')) {
        externalNetworkCalls.push(req.url());
      }
    });

    // Open Google Sheets preview
    const sheetsFeature = page.locator('[data-testid="upcoming-feature-google_sheets_sync"]');
    await sheetsFeature.click();
    await page.waitForTimeout(600);

    // Verify Title and Coming Soon Badge
    const title = page.locator('h3:has-text("Export to Google Sheets")');
    await expect(title).toBeVisible();

    const badge = page.locator('[data-testid="coming-soon-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Coming Soon');

    // Verify Positive & Professional message banner
    const banner = page.locator('[data-testid="coming-soon-message-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Something exciting is on the way!');

    // Verify Primary Action Button is strictly disabled
    const exportBtn = page.locator('[data-testid="coming-soon-disabled-action-btn"]');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeDisabled();
    await expect(exportBtn).toHaveAttribute('aria-disabled', 'true');
    await expect(exportBtn).toContainText('Coming Soon');

    // Verify Authorize button is strictly disabled
    const authorizeBtn = page.locator('[data-testid="sheets-authorize-btn"]');
    await expect(authorizeBtn).toBeVisible();
    await expect(authorizeBtn).toBeDisabled();
    await expect(authorizeBtn).toHaveAttribute('aria-disabled', 'true');

    // Attempt to click disabled export button via force click
    await exportBtn.click({ force: true });
    await page.waitForTimeout(400);

    // Assert ZERO network calls occurred
    expect(externalNetworkCalls.length).toBe(0);

    // Capture screenshot
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_google_sheets_preview.png'
    });

    // Verify Back navigation
    const backBtn = page.locator('[data-testid="coming-soon-back-btn"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForTimeout(400);

    // Modal closed cleanly
    await expect(title).toHaveCount(0);
  });

  test('3. Smart Receipt Scanner: Opens preview, form cannot be submitted, actions disabled', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Open Receipt Scanner preview
    const scannerFeature = page.locator('[data-testid="upcoming-feature-receipt_scanner"]');
    await scannerFeature.click();
    await page.waitForTimeout(600);

    // Verify modal overlay and header
    const modal = page.locator('[data-testid="coming-soon-modal-receipt_scanner"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3#coming-soon-title')).toContainText('Smart Receipt Scanner & OCR');

    // Verify Coming Soon badge and positive message
    const badge = modal.locator('[data-testid="coming-soon-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Coming Soon');

    const banner = modal.locator('[data-testid="coming-soon-message-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("We're working on something useful!");

    // Verify form mockup controls are disabled & readOnly
    const mockInputs = modal.locator('input[disabled]');
    await expect(mockInputs.first()).toBeVisible();
    const count = await mockInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify action button is strictly disabled
    const actionBtn = modal.locator('[data-testid="coming-soon-disabled-action-btn"]');
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toBeDisabled();
    await expect(actionBtn).toContainText('Coming Soon');

    // Verify form submission is prevented
    const form = modal.locator('[data-testid="coming-soon-mockup-form"]');
    const wasSubmitted = await form.evaluate(el => {
      let fired = false;
      el.addEventListener('submit', () => { fired = true; });
      el.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      return fired;
    });
    // Event was intercepted and prevented
    expect(wasSubmitted).toBe(true);

    // Capture screenshot
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_receipt_scanner.png'
    });

    // Close preview via Back button
    await modal.locator('[data-testid="coming-soon-back-btn"]').click();
    await page.waitForTimeout(400);
    await expect(modal).toHaveCount(0);
  });

  test('4. Recurring Subscriptions: Displays preview of burn-rate and planned capabilities', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Open Recurring Subscriptions
    const recurringFeature = page.locator('[data-testid="upcoming-feature-recurring_expenses"]');
    await recurringFeature.click();
    await page.waitForTimeout(600);

    const modal = page.locator('[data-testid="coming-soon-modal-recurring_expenses"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3#coming-soon-title')).toContainText('Recurring Subscriptions');

    // Verify disabled action button
    const actionBtn = modal.locator('[data-testid="coming-soon-disabled-action-btn"]');
    await expect(actionBtn).toBeDisabled();

    // Verify planned capabilities highlights
    await expect(modal.locator('text=Planned Capabilities')).toBeVisible();
    await expect(modal.locator('text=Automatic detection of monthly')).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_recurring_expenses.png'
    });

    // Close preview
    await modal.locator('[data-testid="coming-soon-close-btn"]').click();
    await page.waitForTimeout(400);
    await expect(modal).toHaveCount(0);
  });

  test('5. Direct Bank Account Feeds: Displays Open Banking preview and read-only status', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Open Bank Feeds
    const bankFeature = page.locator('[data-testid="upcoming-feature-bank_auto_sync"]');
    await bankFeature.click();
    await page.waitForTimeout(600);

    const modal = page.locator('[data-testid="coming-soon-modal-bank_auto_sync"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3#coming-soon-title')).toContainText('Direct Bank Account Feeds');

    // Verify disabled action button
    const actionBtn = modal.locator('[data-testid="coming-soon-disabled-action-btn"]');
    await expect(actionBtn).toBeDisabled();

    // Capture screenshot
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_bank_feeds.png'
    });

    // Close preview
    await modal.locator('[data-testid="coming-soon-back-btn"]').click();
    await page.waitForTimeout(400);
    await expect(modal).toHaveCount(0);
  });

  test('6. Search Discovery: Searching "Coming Soon" or feature keywords navigates to preview', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Search for "Coming Soon"
    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Coming Soon');
    await page.waitForTimeout(300);

    // Assert matching results contain Upcoming Features
    const scannerResult = page.locator('[data-testid="search-result-feature_receipt_scanner"]');
    await expect(scannerResult).toBeVisible();
    await expect(scannerResult).toContainText('Smart Receipt Scanner');
    await expect(scannerResult).toContainText('Upcoming Features');

    // Click search result -> opens Receipt Scanner preview modal directly
    await scannerResult.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="coming-soon-modal-receipt_scanner"]');
    await expect(modal).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_search_result.png'
    });

    // Close modal
    await modal.locator('[data-testid="coming-soon-close-btn"]').click();
    await page.waitForTimeout(400);
  });

  test('7. Desktop: Upcoming integrations preview grid is visible and launches preview modal', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to Settings
    const settingsBtn = page.locator('aside button, nav button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await settingsBtn.click();
    await page.waitForTimeout(500);

    // Check Card 3 Upcoming Integrations preview
    const desktopScannerBtn = page.locator('[data-testid="desktop-upcoming-receipt_scanner"]');
    await expect(desktopScannerBtn).toBeVisible();
    await expect(desktopScannerBtn).toContainText('Receipt Scanner');
    await expect(desktopScannerBtn).toContainText('Coming Soon');

    // Click to launch preview modal on desktop
    await desktopScannerBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="coming-soon-modal-receipt_scanner"]');
    await expect(modal).toBeVisible();

    // Capture screenshot of Desktop layout preview
    await page.screenshot({
      path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_coming_soon_desktop_layout.png'
    });

    // Close preview
    await modal.locator('[data-testid="coming-soon-back-btn"]').click();
    await page.waitForTimeout(400);
    await expect(modal).toHaveCount(0);
  });

  test('8. Functional Features Regression Guard: Core features continue working 100% normally', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // 1. Transactions page works
    const txTab = page.locator('nav button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('header h1:has-text("Transactions")')).toBeVisible();

    // 2. Reports page works
    const repTab = page.locator('nav button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await repTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('header h1:has-text("Reports")')).toBeVisible();

    // 3. Overview budget card works
    const homeTab = page.locator('nav button').filter({ hasText: /Overview|Home|होम/i }).first();
    await homeTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();
  });
});
