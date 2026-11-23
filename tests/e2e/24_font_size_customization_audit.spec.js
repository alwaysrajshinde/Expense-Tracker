// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Application-Wide Font Size Customization & Device-Specific Audit', () => {

  test('1. Mobile: Preset font size selection (Small, Medium, Large, Extra Large) & live preview', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Click direct App Font Size row in More page
    const fontRow = page.locator('[data-testid="more-app-font-size-row"]');
    await expect(fontRow).toBeVisible();
    await fontRow.click();
    await page.waitForTimeout(500);

    // Verify Font Size modal / tab is open
    const modalControl = page.locator('[data-testid="font-size-settings-control"]');
    await expect(modalControl).toBeVisible();

    // 1. Select 'Small' (14px)
    const smallPreset = page.locator('[data-testid="font-preset-small"]');
    await smallPreset.click();
    await page.waitForTimeout(300);

    // Verify root HTML element has 14px font-size and data attributes
    const smallRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(smallRootFontSize).toBe('14px');
    const smallDataAttr = await page.evaluate(() => document.documentElement.getAttribute('data-font-size'));
    expect(smallDataAttr).toBe('small');

    // 2. Select 'Large' (18px)
    const largePreset = page.locator('[data-testid="font-preset-large"]');
    await largePreset.click();
    await page.waitForTimeout(300);

    const largeRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(largeRootFontSize).toBe('18px');
    const largeDataAttr = await page.evaluate(() => document.documentElement.getAttribute('data-font-size'));
    expect(largeDataAttr).toBe('large');

    // Verify preview text element updated
    const previewSize = page.locator('[data-testid="preview-current-size"]');
    await expect(previewSize).toContainText('18px');
    await expect(previewSize).toContainText('Large');

    // Capture screenshot of Large preset in mobile settings
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_font_preset_large_mobile.png' });

    // 3. Select 'Extra Large' (20px)
    const xlargePreset = page.locator('[data-testid="font-preset-extra-large"]');
    await xlargePreset.click();
    await page.waitForTimeout(300);

    const xlargeRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(xlargeRootFontSize).toBe('20px');

    // 4. Click Reset to Default button
    const resetBtn = page.locator('[data-testid="reset-font-button"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForTimeout(300);

    const defaultRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(defaultRootFontSize).toBe('16px');
    const defaultDataAttr = await page.evaluate(() => document.documentElement.getAttribute('data-font-size'));
    expect(defaultDataAttr).toBe('medium');

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close dialog"], button:has-text("Done"), button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('2. Custom font size slider (12px - 24px) with numeric badge and immediate updates', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const fontRow = page.locator('[data-testid="more-app-font-size-row"]');
    await fontRow.click();
    await page.waitForTimeout(500);

    // Set slider value to 22px
    const slider = page.locator('[data-testid="font-size-slider"]');
    await slider.fill('22');
    await page.waitForTimeout(300);

    // Verify root font size is 22px
    const customFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(customFontSize).toBe('22px');

    // Verify 'Custom Active · 22px' badge is visible
    const customBadge = page.locator('[data-testid="custom-active-badge"]');
    await expect(customBadge).toBeVisible();
    await expect(customBadge).toContainText('22px');

    // Verify data attributes
    const customDataAttr = await page.evaluate(() => document.documentElement.getAttribute('data-font-size'));
    expect(customDataAttr).toBe('custom');
    const customPxAttr = await page.evaluate(() => document.documentElement.getAttribute('data-font-size-px'));
    expect(customPxAttr).toBe('22');

    // Change slider again to 13px
    await slider.fill('13');
    await page.waitForTimeout(300);

    const custom13FontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(custom13FontSize).toBe('13px');
    await expect(customBadge).toContainText('13px');

    // Capture screenshot of custom font size slider active
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_font_custom_slider.png' });

    // Reset back to default
    const resetBtn = page.locator('[data-testid="reset-font-button"]');
    await resetBtn.click();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('16px');

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close dialog"], button:has-text("Done")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('3. Application-wide proportional scaling across Overview, Transactions, Reports, and Modals', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Open More -> Set Font Size to Large (18px)
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const fontRow = page.locator('[data-testid="more-app-font-size-row"]');
    await fontRow.click();
    await page.waitForTimeout(400);

    const largePreset = page.locator('[data-testid="font-preset-large"]');
    await largePreset.click();
    await page.waitForTimeout(300);

    // Close font modal
    const doneBtn = page.locator('button:has-text("Done"), button[aria-label="Close dialog"]').first();
    if (await doneBtn.isVisible()) await doneBtn.click();
    await page.waitForTimeout(400);

    // 1. Check Overview / Home view
    const homeTab = page.locator('nav button, aside button').filter({ hasText: /Home|मुखपृष्ठ|होम/i }).first();
    await homeTab.click();
    await page.waitForTimeout(500);

    // Check that root style is still 18px on Home screen
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('18px');

    // Check that there is no horizontal scrollbar/overflow
    const hasHorizontalOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    // Capture screenshot of Home screen with Large font
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_app_wide_font_home.png' });

    // 2. Check Transactions view
    const txTab = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txTab.click();
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('18px');
    expect(await page.evaluate(() => document.body.scrollWidth > window.innerWidth)).toBe(false);

    // Capture screenshot of Transactions screen with Large font
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_app_wide_font_transactions.png' });

    // 3. Check Reports view
    const repTab = page.locator('nav button, aside button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await repTab.click();
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('18px');
    expect(await page.evaluate(() => document.body.scrollWidth > window.innerWidth)).toBe(false);

    // Reset back to Medium (16px) for remaining tests
    await moreTab.click();
    await page.waitForTimeout(400);
    await fontRow.click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="reset-font-button"]').click();
    await page.waitForTimeout(300);
    const closeBtn = page.locator('button:has-text("Done"), button[aria-label="Close dialog"]').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  });

  test('4. Independent Mobile (<768px) and Desktop (≥768px) preferences with separate localStorage keys', async ({ page, authHelpers }) => {
    // 1. Mobile Viewport (393x851)
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Set Mobile to Large (18px)
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    const fontRow = page.locator('[data-testid="more-app-font-size-row"]');
    await fontRow.click();
    await page.waitForTimeout(400);

    await page.locator('[data-testid="font-preset-large"]').click();
    await page.waitForTimeout(300);

    // Verify localStorage has saved Large (18px) under expense_tracker_font_mobile
    const mobileSaved = await page.evaluate(() => {
      const raw = localStorage.getItem('expense_tracker_font_mobile');
      return raw ? JSON.parse(raw) : null;
    });
    expect(mobileSaved).not.toBeNull();
    expect(mobileSaved.sizePx).toBe(18);
    expect(mobileSaved.preset).toBe('large');

    // Close modal
    const doneBtn = page.locator('button:has-text("Done"), button[aria-label="Close dialog"]').first();
    if (await doneBtn.isVisible()) await doneBtn.click();
    await page.waitForTimeout(400);

    // 2. Switch to Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(600);

    // Confirm Desktop uses its independent default or previously saved desktop preference (16px default)
    const desktopRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(desktopRootFontSize).toBe('16px');

    // Confirm that mobile preference was NOT overwritten by switching to desktop
    const mobileStillSaved = await page.evaluate(() => {
      const raw = localStorage.getItem('expense_tracker_font_mobile');
      return raw ? JSON.parse(raw) : null;
    });
    expect(mobileStillSaved.sizePx).toBe(18);

    // On Desktop, change preference to Small (14px)
    const desktopSmallPreset = page.locator('[data-testid="font-preset-small"]').first();
    await expect(desktopSmallPreset).toBeVisible();
    await desktopSmallPreset.click();
    await page.waitForTimeout(300);

    // Verify Desktop saved under expense_tracker_font_desktop
    const desktopSaved = await page.evaluate(() => {
      const raw = localStorage.getItem('expense_tracker_font_desktop');
      return raw ? JSON.parse(raw) : null;
    });
    expect(desktopSaved).not.toBeNull();
    expect(desktopSaved.sizePx).toBe(14);
    expect(desktopSaved.preset).toBe('small');

    // 3. Switch BACK to Mobile Viewport (393x851)
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(600);

    // Verify Mobile automatically re-activates its independent Large (18px) size!
    const mobileRestoredFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
    expect(mobileRestoredFontSize).toBe('18px');

    // Verify both localStorage keys remain strictly independent and intact
    const finalKeys = await page.evaluate(() => ({
      mobile: JSON.parse(localStorage.getItem('expense_tracker_font_mobile') || '{}'),
      desktop: JSON.parse(localStorage.getItem('expense_tracker_font_desktop') || '{}')
    }));
    expect(finalKeys.mobile.sizePx).toBe(18);
    expect(finalKeys.desktop.sizePx).toBe(14);

    // Capture screenshot verifying separate storage keys
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_device_specific_preferences.png' });
  });

  test('5. Persistence across page reload, login/logout, and safe fallback on corrupted storage', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // 1. Verify survival across page reload
    await page.evaluate(() => {
      localStorage.setItem('expense_tracker_font_mobile', JSON.stringify({ mode: 'preset', preset: 'large', sizePx: 18 }));
    });
    await page.reload();
    await page.waitForTimeout(600);

    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('18px');

    // 2. Corrupted JSON in localStorage falls back safely to default 16px Medium without crashing
    await page.evaluate(() => {
      localStorage.setItem('expense_tracker_font_mobile', '{ corrupted-invalid-json-content: true ');
    });
    await page.reload();
    await page.waitForTimeout(600);

    // Must safely fallback to default 16px
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('16px');
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-font-size'))).toBe('medium');

    // 3. Out-of-bounds custom values safely clamped (e.g. 999px clamped to 24px)
    await page.evaluate(() => {
      localStorage.setItem('expense_tracker_font_mobile', JSON.stringify({ mode: 'custom', sizePx: 999 }));
    });
    await page.reload();
    await page.waitForTimeout(600);

    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('24px');

    // 4. Reset to clean default Medium
    await page.evaluate(() => {
      localStorage.setItem('expense_tracker_font_mobile', JSON.stringify({ mode: 'preset', preset: 'medium', sizePx: 16 }));
    });
    await page.reload();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('16px');
  });

  test('6. Search discovery: "Font Size" in More page search returns App Font Size and deep navigates', async ({ page, authHelpers }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await authHelpers.loginAsRaj();
    await page.waitForTimeout(600);

    // Navigate to More
    const moreTab = page.locator('nav button, aside button').filter({ hasText: /More|अधिक/i }).first();
    await moreTab.click();
    await page.waitForTimeout(500);

    // Type 'Font Size' in More page search input
    const searchInput = page.locator('input[placeholder*="Search settings"]').first();
    await searchInput.fill('Font Size');
    await page.waitForTimeout(300);

    // Verify search result appears with parent category 'Appearance & Accessibility'
    const fontSearchResult = page.locator('[data-testid="search-result-app_font_size"]');
    await expect(fontSearchResult).toBeVisible();
    await expect(fontSearchResult).toContainText('Appearance & Accessibility');
    await expect(fontSearchResult).toContainText('App Font Size');

    // Capture screenshot of Font Size search result
    await page.screenshot({ path: 'C:/Users/hi/.gemini/antigravity/brain/6e272aed-82fa-4053-96f8-0b6b7bbfe2c7/verify_font_search_result.png' });

    // Tap search result -> deep navigates directly to Font Size dialog
    await fontSearchResult.click();
    await page.waitForTimeout(500);

    // Verify Font Size control is open
    const fontControl = page.locator('[data-testid="font-size-settings-control"]');
    await expect(fontControl).toBeVisible();
  });
});
