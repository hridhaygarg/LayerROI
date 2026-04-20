export default {
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: false,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
};
