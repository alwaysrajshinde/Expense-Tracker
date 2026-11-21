// @ts-check
const { test, expect } = require('../fixtures/auth.fixture');
const { generateUniqueUser } = require('../fixtures/testData');
const { getRajRecordCount, cleanTestUsers } = require('../helpers/dbHelper');

test.describe('Area G: Data Isolation, Security & Integrity', () => {
  test.afterAll(() => {
    cleanTestUsers();
  });

  test('G1: API rejects unauthenticated requests with 401 Unauthorized', async ({ request }) => {
    // Attempt to access /api/transactions without any user headers
    const res = await request.get('/api/transactions');
    expect(res.status()).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
  });

  test('G2: Complete Data Isolation between independent users', async ({ page, authHelpers }) => {
    const userAlice = generateUniqueUser('alice');
    const userBob = generateUniqueUser('bob');

    // 1. Alice logs in and adds a secret expense
    await authHelpers.loginAsNewUser(userAlice.email, userAlice.name);
    const addBtn = page.locator('button:has-text("Add Expense")').first();
    await addBtn.click();

    const uniqueSecretDesc = `AliceConfidentialPurchase_${Date.now()}`;
    await page.locator('.fixed input[placeholder="0"]').fill('888');
    await page.locator('input[placeholder*="Lunch with colleagues"]').fill(uniqueSecretDesc);
    await page.locator('button[type="submit"]:has-text("Save Expense")').click();
    await page.waitForTimeout(1000);

    // 2. Alice logs out
    await authHelpers.logout();

    // 3. Bob logs in
    await authHelpers.loginAsNewUser(userBob.email, userBob.name);
    await page.locator('button:has-text("Transactions")').first().click();
    await page.waitForTimeout(1000);

    // 4. Verify Alice's secret expense is NOT visible to Bob
    const bobPageText = await page.innerText('body');
    expect(bobPageText).not.toContain(uniqueSecretDesc);
    expect(bobPageText).toContain('0 entries found');
  });

  test('G3: Raj Shinde historical database records remain 100% intact', async () => {
    const count = getRajRecordCount();
    expect(count).toBeGreaterThanOrEqual(1216);
  });

  test('G4: API export is scoped strictly to the requesting user identity', async ({ request }) => {
    const userAlice = generateUniqueUser('alice_export');

    // Export for Alice (should be empty initially)
    const resAlice = await request.get('/api/export/json', {
      headers: { 'x-user-email': userAlice.email }
    });
    expect(resAlice.status()).toBe(200);
    const aliceData = await resAlice.json();
    expect(aliceData.user.email).toBe(userAlice.email);
    expect(aliceData.transactions.length).toBe(0);

    // Export for Raj (must contain all 1,216 historical records)
    const resRaj = await request.get('/api/export/json', {
      headers: { 'x-user-email': 'raaajshinde@gmail.com' }
    });
    expect(resRaj.status()).toBe(200);
    const rajData = await resRaj.json();
    expect(rajData.transactions.length).toBeGreaterThanOrEqual(1216);
  });
});
