// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Welcome Back Session-Aware Greeting Trigger Audit (Test 30)', () => {

  test('Scenario 1 & 2: First application launch shows greeting once; Refreshing Overview never re-triggers greeting', async ({ page, authHelpers }) => {
    // Start fresh browser context (new session)
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // 1. First launch: Greeting should appear
    const greetingHeading = page.locator('h2:has-text("Good")').first();
    await expect(greetingHeading).toBeVisible({ timeout: 6000 });

    // Dismiss greeting
    await greetingHeading.click();
    await page.waitForTimeout(600);
    await expect(greetingHeading).not.toBeVisible();

    // Verify sessionStorage has recorded the session flag
    const sessionFlag = await page.evaluate(() => sessionStorage.getItem('et_welcome_greeting_session_shown'));
    expect(sessionFlag).toBe('true');

    // 2. Refresh Overview (F5 / reload)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify Welcome Greeting does NOT appear on refresh
    await page.waitForTimeout(1000);
    const greetingAfterRefresh = page.locator('h2:has-text("Good")').first();
    await expect(greetingAfterRefresh).not.toBeVisible();

    // Verify main overview dashboard is directly interactive
    await expect(page.locator('text=MONTHLY BUDGET').first()).toBeVisible({ timeout: 6000 });
  });

  test('Scenario 3, 4, 5: Internal navigation to Transactions, Reports, and More does NOT trigger greeting', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // 3. Navigate to Transactions
    const txBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // 4. Navigate to Reports
    const reportsBtn = page.locator('nav button, aside button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await reportsBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Reports/i }).first()).toBeVisible();

    // 5. Navigate to More
    const moreBtn = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
  });

  test('Scenario 6 & 7: Opening/closing settings modals & refreshing nested settings does NOT trigger greeting', async ({ page, authHelpers }) => {
    await page.goto('/#/more');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // 6. Open nested Settings Modal (Budget Settings)
    const budgetBtn = page.locator('button:has-text("Budget Settings"), button:has-text("Monthly Budget")').first();
    if (await budgetBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await budgetBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();

      // Close modal
      const closeBtn = page.locator('button[aria-label="Close Modal"], button:has-text("Cancel"), button:has-text("Save")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      }
      await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
    }

    // 7. Refresh nested route directly
    await page.goto('/#/more?section=budget');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
  });

  test('Scenario 8: Navigating back and forth multiple times produces zero duplicate greetings', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // Rapid navigation loop
    const tabs = ['transactions', 'reports', 'more', 'overview'];
    for (const tab of tabs) {
      await page.evaluate((t) => { window.location.hash = `#/${t}`; }, tab);
      await page.waitForTimeout(250);
      await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
    }
  });

  test('Scenario 9: Starting a new application session re-triggers the greeting once', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss greeting
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 4000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // Simulate closing the browser/PWA and launching a brand new session (clears sessionStorage)
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Reopen application in the new session
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Greeting SHOULD appear for the new session
    const newSessionGreeting = page.locator('h2:has-text("Good")').first();
    await expect(newSessionGreeting).toBeVisible({ timeout: 6000 });

    // Click to dismiss
    await newSessionGreeting.click();
    await page.waitForTimeout(400);
    await expect(newSessionGreeting).not.toBeVisible();

    // Reload again within the same new session -> must NOT appear
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();
  });

  test('Scenario 10: Firebase authentication restoration does not cause duplicate greetings', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial launch greeting
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 4000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // Wait until authenticated session is established
    await expect(page.locator('text=MONTHLY BUDGET').first()).toBeVisible({ timeout: 8000 });

    // Emulate background token refresh event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForTimeout(500);

    // Verify greeting overlay count is strictly 0
    const greetingCount = await page.locator('h2:has-text("Good")').count();
    expect(greetingCount).toBe(0);
  });

  test('Scenario 11 & 12: Mobile / PWA standalone mode distinction between refresh and new session', async ({ page, authHelpers }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 4000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // Emulate mobile PWA refresh / pull-to-refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(page.locator('h2:has-text("Good")')).not.toBeVisible();

    // Emulate PWA restart (new browsing context / cleared sessionStorage)
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Greeting appears on PWA cold restart
    await expect(page.locator('h2:has-text("Good")').first()).toBeVisible({ timeout: 6000 });
  });

});
