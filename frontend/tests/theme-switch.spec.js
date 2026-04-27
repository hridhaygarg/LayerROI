import { test, expect } from '@playwright/test';

test('theme toggle visibly changes colors on landing page', async ({ page }) => {
  await page.goto('https://layeroi.com');
  await page.waitForTimeout(3000); // Wait for React to hydrate

  // Check initial state
  const getDataTheme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const getBodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  const initialTheme = await getDataTheme();
  const initialBg = await getBodyBg();
  console.log('Initial state:', { theme: initialTheme, bg: initialBg });

  // Find the Light button and click it
  const lightBtn = page.locator('button[title="Light"]');
  const lightBtnCount = await lightBtn.count();
  console.log('Light buttons found:', lightBtnCount);

  if (lightBtnCount === 0) {
    // Try alternative: find by text content
    const allBtns = page.locator('button');
    const count = await allBtns.count();
    console.log('Total buttons on page:', count);
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await allBtns.nth(i).textContent();
      const title = await allBtns.nth(i).getAttribute('title');
      if (text.includes('☀') || text.includes('☾') || title) {
        console.log(`  Button ${i}: text="${text}" title="${title}"`);
      }
    }
  }

  expect(lightBtnCount).toBeGreaterThan(0);

  await lightBtn.first().click();
  await page.waitForTimeout(1000);

  const afterLightTheme = await getDataTheme();
  const afterLightBg = await getBodyBg();
  console.log('After Light click:', { theme: afterLightTheme, bg: afterLightBg });

  expect(afterLightTheme).toBe('light');

  // Verify background actually changed to light
  const lightRgb = afterLightBg.match(/\d+/g).map(Number);
  expect(lightRgb[0]).toBeGreaterThan(200);

  // Click Dark
  const darkBtn = page.locator('button[title="Dark"]');
  await darkBtn.first().click();
  await page.waitForTimeout(1000);

  const afterDarkTheme = await getDataTheme();
  const afterDarkBg = await getBodyBg();
  console.log('After Dark click:', { theme: afterDarkTheme, bg: afterDarkBg });

  expect(afterDarkTheme).toBe('dark');
  const darkRgb = afterDarkBg.match(/\d+/g).map(Number);
  expect(darkRgb[0]).toBeLessThan(30);

  // Click Auto
  const autoBtn = page.locator('button[title="Auto"]');
  await autoBtn.first().click();
  await page.waitForTimeout(1000);

  const autoTheme = await getDataTheme();
  console.log('After Auto click:', { theme: autoTheme });
  expect(['light', 'dark']).toContain(autoTheme);

  console.log('✅ Theme toggle test PASSED');
});
