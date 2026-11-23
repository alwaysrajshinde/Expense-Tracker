// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Premium Application-Wide Animations & Offline Motion Audit', () => {
  test.beforeEach(async ({ authHelpers }) => {
    // Start with a clean authenticated session
    await authHelpers.loginAsRaj();
  });

  test('1. Page Transitions across Overview, Transactions, Reports, and More', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Overview Page loads with page-enter transition
    await expect(page.locator('.page-enter').first()).toBeVisible({ timeout: 10000 });
    const pageEnterElem = page.locator('.page-enter').first();
    const animationName = await pageEnterElem.evaluate(el => window.getComputedStyle(el).animationName);
    expect(animationName).toMatch(/pageEnter|pageFadeIn/);

    // Navigate to Transactions
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(350);
    await expect(page.locator('.page-enter').first()).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // Navigate to Reports
    const reportsNavBtn = page.locator('nav button, aside button').filter({ hasText: /Reports|रिपोर्ट्स/i }).first();
    await reportsNavBtn.click();
    await page.waitForTimeout(350);
    await expect(page.locator('.page-enter').first()).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Reports|Analytics/i }).first()).toBeVisible();

    // Sub-tab transition in Reports (Overview -> Categories)
    const catTabBtn = page.locator('main, header').locator('button').filter({ hasText: /^Categories|कॅटेगरी/i }).first();
    if (await catTabBtn.isVisible()) {
      await catTabBtn.click();
      await page.waitForTimeout(250);
      await expect(page.locator('.animate-tab-content').first()).toBeVisible();
    }

    // Navigate to More / Settings
    const moreNavBtn = page.locator('nav button, aside button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await moreNavBtn.click();
    await page.waitForTimeout(350);
    await expect(page.locator('.page-enter').first()).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /More|Settings/i }).first()).toBeVisible();

    // Return to Overview
    const homeNavBtn = page.locator('nav button, aside button').filter({ hasText: /Home|Overview|मुख्य/i }).first();
    await homeNavBtn.click();
    await page.waitForTimeout(350);
    await expect(page.locator('.page-enter').first()).toBeVisible();
    await expect(page.locator('text=Monthly Budget').first()).toBeVisible();

    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404'))).toHaveLength(0);
  });

  test('2. Dashboard Cards and Circular Gauge Motion Styles', async ({ page }) => {
    // Overview cards have animate-card or interactive-card
    await expect(page.locator('.purple-hero-gradient').first()).toBeVisible({ timeout: 10000 });
    const heroCard = page.locator('.purple-hero-gradient').first();
    const hasCardClass = await heroCard.evaluate(el => 
      el.classList.contains('animate-card') || el.classList.contains('interactive-card')
    );
    expect(hasCardClass).toBe(true);

    // Quick stat cards have interactive-card styling
    const statCards = page.locator('.interactive-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Circular progress gauge SVG stroke transition
    const circleGauge = page.locator('circle[stroke-dashoffset]').first();
    if (await circleGauge.isVisible()) {
      const transitionStyle = await circleGauge.evaluate(el => window.getComputedStyle(el).transition);
      expect(transitionStyle).toContain('stroke-dashoffset');
    }
  });

  test('3. Modal Entrance (Add Expense) with Backdrop Fade and Card Scale/Slide', async ({ page }) => {
    // Click Add Expense FAB / button
    const addBtn = page.locator('button[aria-label*="Add"], button:has-text("Add Expense"), button:has-text("खर्च जोडा")').first();
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();

    // Verify modal overlay has animate-fade-in
    const modalBackdrop = page.locator('.fixed.inset-0.z-50.animate-fade-in').first();
    await expect(modalBackdrop).toBeVisible({ timeout: 5000 });

    // Verify modal card has scale-in or slide-up animation
    const modalDialog = page.locator('.animate-slide-up, .animate-scale-in').first();
    await expect(modalDialog).toBeVisible();

    // Close modal via Close / X button
    const closeBtn = page.locator('button[aria-label*="Close"], button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(modalDialog).not.toBeVisible();
  });

  test('4. Custom Dropdown Menu Smooth Expansion and Chevron Rotation', async ({ page }) => {
    // Navigate to Transactions or Reports where CustomDropdown is present
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(400);

    // Locate a CustomDropdown trigger button
    const dropdownBtn = page.locator('button[aria-haspopup="listbox"]').first();
    await expect(dropdownBtn).toBeVisible({ timeout: 8000 });

    // Open dropdown
    await dropdownBtn.click();
    await page.waitForTimeout(200);

    // Verify dropdown menu appeared with animate-dropdown class
    const dropdownMenu = page.locator('.animate-dropdown, [role="listbox"]').first();
    await expect(dropdownMenu).toBeVisible();

    // Verify chevron rotated
    const chevron = dropdownBtn.locator('svg.lucide-chevron-down');
    if (await chevron.isVisible()) {
      const isRotated = await chevron.evaluate(el => 
        el.classList.contains('rotate-180') || 
        window.getComputedStyle(el).rotate.includes('180') || 
        window.getComputedStyle(el).transform !== 'none'
      );
      expect(isRotated).toBe(true);
    }

    // Click outside to close smoothly
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
    await expect(page.locator('.animate-dropdown')).not.toBeVisible();
  });

  test('5. Toast Notifications Entrance (Slide-Down)', async ({ page }) => {
    // Trigger a toast (e.g., set privacy hide amounts or quick action)
    const eyeToggle = page.locator('button[aria-label*="amounts" i], button[title*="amounts" i]').first();
    if (await eyeToggle.isVisible()) {
      await eyeToggle.click();
      await page.waitForTimeout(200);

      // Verify pill toast appears with animate-slide-down
      const toast = page.locator('.animate-slide-down').first();
      await expect(toast).toBeVisible({ timeout: 4000 });
      const toastAnim = await toast.evaluate(el => window.getComputedStyle(el).animationName);
      expect(toastAnim).toMatch(/slideDown/i);

      // Toggle back
      await eyeToggle.click();
    }
  });

  test('6. Transactions List Rows & Smooth Optimistic Deletion Dialog', async ({ page }) => {
    // Navigate to Transactions
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(400);

    // Verify transaction rows have tx-row transition class
    const txRows = page.locator('.tx-row');
    const rowCount = await txRows.count();
    if (rowCount > 0) {
      const firstRow = txRows.first();
      const transition = await firstRow.evaluate(el => window.getComputedStyle(el).transition);
      expect(transition).toContain('transform');

      // Click delete icon on first row
      const deleteBtn = firstRow.locator('button[title*="Delete"], button[aria-label*="Delete"]').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // Verify Delete Confirmation Modal opens with animate-fade-in and animate-scale-in
        const confirmModal = page.locator('.fixed.inset-0.z-50.animate-fade-in').first();
        await expect(confirmModal).toBeVisible({ timeout: 4000 });
        const modalBody = confirmModal.locator('.animate-scale-in');
        await expect(modalBody).toBeVisible();

        // Cancel deletion safely
        const cancelBtn = confirmModal.locator('button:has-text("Cancel")');
        await cancelBtn.click();
        await page.waitForTimeout(300);
        await expect(confirmModal).not.toBeVisible();
      }
    }
  });

  test('7. Offline Compatibility: Animations function 100% when network is offline', async ({ page, context }) => {
    // Verify online state initially
    await expect(page.locator('.page-enter').first()).toBeVisible({ timeout: 8000 });

    // Emulate complete offline disconnection
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // Navigate to Transactions while completely offline
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(350);

    // Verify page transition runs offline without network
    const pageEnterOffline = page.locator('.page-enter').first();
    await expect(pageEnterOffline).toBeVisible();
    const animName = await pageEnterOffline.evaluate(el => window.getComputedStyle(el).animationName);
    expect(animName).toMatch(/pageEnter|pageFadeIn/);

    // Open Add Expense Modal while offline
    const addBtn = page.locator('button[aria-label*="Add"], button:has-text("Add Expense")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);

      // Verify modal animations work offline
      const modalBackdrop = page.locator('.fixed.inset-0.z-50.animate-fade-in').first();
      await expect(modalBackdrop).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button[aria-label*="Close"], button:has(svg.lucide-x)').first();
      await closeBtn.click();
      await page.waitForTimeout(200);
    }

    // Navigate to More while offline
    const moreNavBtn = page.locator('nav button, aside button').filter({ hasText: /More|Settings|अधिक/i }).first();
    await moreNavBtn.click();
    await page.waitForTimeout(350);
    await expect(page.locator('.page-enter').first()).toBeVisible();

    // Re-enable online network
    await context.setOffline(false);
    await page.waitForTimeout(300);
  });

  test('8. Accessibility: Strictly respects prefers-reduced-motion: reduce', async ({ page }) => {
    // Emulate reduced motion user OS preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForTimeout(500);

    // Check that button transition duration is <= 0.01ms / 0.001ms
    const button = page.locator('button').first();
    const transitionDuration = await button.evaluate(el => window.getComputedStyle(el).transitionDuration);
    // When prefers-reduced-motion is active, our CSS sets 0.001ms !important (parsed as '0.000001s' or '0s')
    const durationNum = parseFloat(transitionDuration) || 0;
    expect(durationNum).toBeLessThanOrEqual(0.01);

    // Ensure application functionality is 100% intact with reduced motion
    const txNavBtn = page.locator('nav button, aside button').filter({ hasText: /Transactions|लेन-देन/i }).first();
    await txNavBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('h1, h2').filter({ hasText: /Transactions/i }).first()).toBeVisible();

    // Open Add modal and verify it opens instantly without error
    const addBtn = page.locator('button[aria-label*="Add"], button:has-text("Add Expense")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      const closeBtn = page.locator('button[aria-label*="Close"], button:has(svg.lucide-x)').first();
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
