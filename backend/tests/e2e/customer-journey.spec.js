import { test, expect } from '@playwright/test';

const SITE = 'https://layeroi.com';
const API = 'https://api.layeroi.com';

const EMAIL = `e2e_${Date.now()}@layeroi-test.com`;
const PASSWORD = 'TestPass123!';

test.describe('layeroi full customer journey', () => {
  let consoleErrors = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));
    page.on('requestfailed', req => {
      const url = req.url();
      // Skip Google Analytics, favicon, and other non-critical failures
      if (!url.includes('google-analytics') && !url.includes('gtag') && !url.includes('favicon')) {
        networkErrors.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
      }
    });
  });

  test.afterEach(async () => {
    if (consoleErrors.length > 0) console.log('CONSOLE ERRORS:', consoleErrors);
    if (networkErrors.length > 0) console.log('NETWORK ERRORS:', networkErrors);
  });

  test('1. Landing page loads cleanly', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/layeroi/i);
    // Filter out non-critical errors (favicon, analytics, extensions)
    const critical = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('gtag') && !e.includes('analytics') && !e.includes('ERR_BLOCKED_BY_CLIENT')
    );
    expect(critical).toEqual([]);
  });

  test('2. Signup page loads and form is visible', async ({ page }) => {
    await page.goto(`${SITE}/signup`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[name="email"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="password"]').first()).toBeVisible({ timeout: 5000 });
    const critical = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('gtag') && !e.includes('ERR_BLOCKED_BY_CLIENT'));
    expect(critical).toEqual([]);
  });

  test('3. Signup creates account and shows API key', async ({ page }) => {
    await page.goto(`${SITE}/signup`, { waitUntil: 'networkidle' });

    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="company"]', 'E2E Test Corp');
    await page.fill('input[name="password"]', PASSWORD);

    await page.click('button[type="submit"]');

    // Should show "Ready to track costs!" or API key
    await expect(page.locator('text=/Ready to track|API key|sk-/i').first()).toBeVisible({ timeout: 15000 });

    // Verify token saved
    const token = await page.evaluate(() => localStorage.getItem('layeroi_token'));
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(20);
  });

  test('4. Go to dashboard button navigates', async ({ page }) => {
    await page.goto(`${SITE}/signup`, { waitUntil: 'networkidle' });

    await page.fill('input[name="name"]', 'E2E Nav Test');
    await page.fill('input[name="email"]', `e2e_nav_${Date.now()}@layeroi-test.com`);
    await page.fill('input[name="company"]', 'Nav Corp');
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for success state
    await expect(page.locator('text=/Ready to track|Go to dashboard/i').first()).toBeVisible({ timeout: 15000 });

    // Click Go to dashboard
    const dashBtn = page.locator('button:has-text("Go to dashboard")');
    if (await dashBtn.isVisible({ timeout: 3000 })) {
      await dashBtn.click();
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      expect(page.url()).toContain('dashboard');
    }
  });

  test('5. Login page works with correct credentials', async ({ page }) => {
    await page.goto(`${SITE}/login`, { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });

  test('6. Login rejects wrong password', async ({ page }) => {
    await page.goto(`${SITE}/login`, { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');

    // Should show error, NOT redirect
    await expect(page.locator('text=/invalid|wrong|error/i').first()).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('7. CORS fetch from browser works', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'networkidle' });
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const r = await fetch(`${apiUrl}/health`);
        const body = await r.json();
        return { ok: r.ok, status: r.status, body };
      } catch (e) {
        return { error: e.message };
      }
    }, API);

    expect(result.error).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('ok');
  });

  test('8. All JS/CSS load with correct MIME types', async ({ page }) => {
    const badMimes = [];
    page.on('response', async resp => {
      const url = resp.url();
      const ct = resp.headers()['content-type'] || '';
      if (url.endsWith('.js') && !ct.includes('javascript') && !ct.includes('json')) {
        badMimes.push(`${url} → ${ct}`);
      }
      if (url.endsWith('.css') && !ct.includes('css')) {
        badMimes.push(`${url} → ${ct}`);
      }
    });

    await page.goto(SITE, { waitUntil: 'networkidle' });
    expect(badMimes).toEqual([]);
  });

  test('9. No critical console errors on landing, signup, login', async ({ page }) => {
    const allErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('gtag') && !msg.text().includes('ERR_BLOCKED_BY_CLIENT')) {
        allErrors.push(`[${page.url()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => allErrors.push(`[${page.url()}] ${err.message}`));

    for (const path of ['/', '/signup', '/login', '/docs', '/blog']) {
      await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle' });
    }

    expect(allErrors).toEqual([]);
  });

  test('10. Docs and Blog pages render content', async ({ page }) => {
    await page.goto(`${SITE}/docs`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=/documentation|quick start|getting started/i').first()).toBeVisible({ timeout: 10000 });

    await page.goto(`${SITE}/blog`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=/blog|insights|AI economics/i').first()).toBeVisible({ timeout: 10000 });

    await page.goto(`${SITE}/docs/quick-start`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=/Quick Start|Prerequisites|SDK/i').first()).toBeVisible({ timeout: 10000 });
  });
});
