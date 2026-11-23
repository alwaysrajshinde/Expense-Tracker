// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Overview Show/Hide Amounts & Application Motion Audit (Test 31)', () => {

  test('Scenario 1: Show/Hide toggle button is clearly visible and toggles masked amounts', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // 1. Verify Toggle Button is visible in hero purple card
    const toggleBtn = page.locator('[data-testid="toggle-hide-amounts"]').first();
    await expect(toggleBtn).toBeVisible({ timeout: 6000 });

    // Ensure initial unmasked state
    const unmaskedSpent = page.locator('text=₹').first();
    await expect(unmaskedSpent).toBeVisible();

    // 2. Click Toggle Button to Hide Amounts
    await toggleBtn.click();
    await page.waitForTimeout(300);

    // Verify toggle button updated label/state (aria-label updated for eye icon)
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show amounts');

    // Verify localStorage persistence
    const storedState = await page.evaluate(() => localStorage.getItem('expense_tracker_hide_amounts'));
    expect(storedState).toBe('true');

    // Verify amounts are masked to ₹ ••••••
    const maskedElements = page.locator('text=₹ ••••••');
    const count = await maskedElements.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // 3. Refresh the page to verify persistent masking
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="toggle-hide-amounts"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=₹ ••••••').first()).toBeVisible({ timeout: 8000 });

    const maskedAfterReload = page.locator('text=₹ ••••••');
    const countAfterReload = await maskedAfterReload.count();
    expect(countAfterReload).toBeGreaterThanOrEqual(3);

    // 4. Click Toggle Button again to Unmask
    const toggleBtnAfterReload = page.locator('[data-testid="toggle-hide-amounts"]').first();
    await toggleBtnAfterReload.click();
    await page.waitForTimeout(300);

    const storedStateAfterUnmask = await page.evaluate(() => localStorage.getItem('expense_tracker_hide_amounts'));
    expect(storedStateAfterUnmask).toBe('false');

    // Verify masked elements count is 0
    const maskedAfterUnmask = await page.locator('text=₹ ••••••').count();
    expect(maskedAfterUnmask).toBe(0);
  });

  test('Scenario 2: Card hover lift & page enter motion classes are active', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // 1. Verify page-enter animation class on active page container
    const pageEnterContainer = page.locator('.page-enter').first();
    await expect(pageEnterContainer).toBeVisible({ timeout: 6000 });

    // 2. Verify card-hover-lift class on dashboard cards
    const hoverCards = page.locator('.card-hover-lift');
    const cardCount = await hoverCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // 3. Verify CSS animation rules applied
    const animationName = await page.evaluate(() => {
      const el = document.querySelector('.page-enter');
      return el ? window.getComputedStyle(el).animationName : null;
    });
    expect(animationName).toContain('pageEnter');
  });

  test('Scenario 3: Tab navigation smoothly triggers page-enter motion', async ({ page, authHelpers }) => {
    await page.goto('/');
    await authHelpers.loginAsRaj();

    // Dismiss initial greeting if present
    const greeting = page.locator('h2:has-text("Good")').first();
    if (await greeting.isVisible({ timeout: 3000 }).catch(() => false)) {
      await greeting.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Transactions tab
    const txBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txBtn.click();
    await page.waitForTimeout(350);

    // Verify .page-enter is applied to Transactions page
    const txContainer = page.locator('.page-enter').first();
    await expect(txContainer).toBeVisible();

    // Navigate back to Overview / Home
    const homeBtn = page.locator('nav button, aside button').filter({ hasText: /Home|Overview|होम/i }).first();
    await homeBtn.click();
    await page.waitForTimeout(350);

    const homeContainer = page.locator('.page-enter').first();
    await expect(homeContainer).toBeVisible();
    await expect(page.locator('[data-testid="toggle-hide-amounts"]').first()).toBeVisible();
  });

});
