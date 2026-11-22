// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const path = require('path');

test.describe('Welcome Back Motivational Overlay Audit', () => {
  const artifactDir = 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7';

  test('Verify Welcome Back Motivational Design renders on load and dismisses', async ({ page, authHelpers }) => {
    test.setTimeout(30000);
    await page.setViewportSize({ width: 393, height: 851 });

    // Login
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Verify Welcome Overlay is visible immediately on load
    const greetingHeading = page.locator('h2:has-text("Good")').first();
    await expect(greetingHeading).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(600);

    // Capture screenshot of the custom Welcome Back design
    await page.screenshot({ path: path.join(artifactDir, 'verify_welcome_back_custom_design.png'), fullPage: false });

    // Click anywhere to dismiss
    await greetingHeading.click();
    await page.waitForTimeout(800);

    // Verify overlay has dismissed and main dashboard is interactive
    await expect(page.locator('text=MONTHLY BUDGET').first()).toBeVisible({ timeout: 6000 });
    await page.screenshot({ path: path.join(artifactDir, 'verify_dashboard_after_dismiss.png'), fullPage: false });
  });
});
