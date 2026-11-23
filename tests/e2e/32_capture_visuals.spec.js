// @ts-check
const { test } = require('../fixtures/auth.fixture');
const path = require('path');

const artifactDir = 'C:\\Users\\hi\\.gemini\\antigravity\\brain\\6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

test.describe('Capture Visual Proof', () => {
  test('Capture Overview Show/Hide Unmasked and Masked states', async ({ page, authHelpers, isMobile }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    const prefix = isMobile ? 'mobile' : 'desktop';

    // Wait for hero card
    await page.waitForSelector('[data-testid="toggle-hide-amounts"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Screenshot 1: Unmasked
    await page.screenshot({ path: path.join(artifactDir, `${prefix}_overview_unmasked.png`) });

    // Click toggle to mask
    await page.click('[data-testid="toggle-hide-amounts"]');
    await page.waitForTimeout(500);

    // Screenshot 2: Masked
    await page.screenshot({ path: path.join(artifactDir, `${prefix}_overview_masked.png`) });
  });
});
