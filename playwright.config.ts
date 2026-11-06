import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // The suite runs against the Vite dev server, which compiles lazy routes on first
  // visit; allow for that cold start under parallel load.
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    // Engine coverage for Firefox and Safari users on core flows. Always on in CI;
    // locally opt in with E2E_ALL_BROWSERS=1 after `npx playwright install`.
    ...(process.env.CI || process.env.E2E_ALL_BROWSERS
      ? [
          {
            name: 'desktop-firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /(template|account|requests-.*)\.spec\.ts/,
          },
          {
            name: 'desktop-webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /(template|account|requests-.*)\.spec\.ts/,
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
