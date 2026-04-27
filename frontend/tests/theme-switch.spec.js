import { test, expect } from '@playwright/test';

test('theme toggle visibly changes colors on landing page', async ({ page }) => {
  await page.goto('https://layeroi.com');
  await page.waitForTimeout(2000);

  // Get initial background color of body
  const getBodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const getBodyColor = () => page.evaluate(() => getComputedStyle(document.body).color);
  const getDataTheme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

  const initialBg = await getBodyBg();
  const initialColor = await getBodyColor();
  const initialTheme = await getDataTheme();
  console.log('Initial:', { bg: initialBg, color: initialColor, theme: initialTheme });

  // Click Light toggle (first button in the toggle group)
  const lightBtn = page.locator('button[title="Light"]');
  await lightBtn.click();
  await page.waitForTimeout(500);

  const lightBg = await getBodyBg();
  const lightColor = await getBodyColor();
  const lightTheme = await getDataTheme();
  console.log('After Light click:', { bg: lightBg, color: lightColor, theme: lightTheme });

  // Assert colors actually changed
  expect(lightTheme).toBe('light');
  expect(lightBg).not.toBe(initialBg);
  // Light bg should be light (rgb values > 200)
  const lightRgb = lightBg.match(/\d+/g).map(Number);
  expect(lightRgb[0]).toBeGreaterThan(200); // R > 200 means light

  // Click Dark toggle
  const darkBtn = page.locator('button[title="Dark"]');
  await darkBtn.click();
  await page.waitForTimeout(500);

  const darkBg = await getBodyBg();
  const darkTheme = await getDataTheme();
  console.log('After Dark click:', { bg: darkBg, theme: darkTheme });

  expect(darkTheme).toBe('dark');
  // Dark bg should be dark (rgb values < 30)
  const darkRgb = darkBg.match(/\d+/g).map(Number);
  expect(darkRgb[0]).toBeLessThan(30); // R < 30 means dark

  // Click Auto toggle
  const autoBtn = page.locator('button[title="Auto"]');
  await autoBtn.click();
  await page.waitForTimeout(500);

  const autoTheme = await getDataTheme();
  console.log('After Auto click:', { theme: autoTheme });
  // Auto should resolve to either light or dark based on system
  expect(['light', 'dark']).toContain(autoTheme);

  console.log('✅ Theme toggle test PASSED — colors visibly change between Light and Dark');
});
