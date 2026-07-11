import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright end-to-end configuration for np-kitchen-bot.
 *
 * The suite drives the web build of the Ionic app via `ng serve` (dev
 * configuration — the production build tree-shakes the modals away, see
 * README). A single Chromium project with a mobile viewport mirrors the
 * primary Capacitor/Android target.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // One local retry absorbs dev-server cold-compile flakes (a warm re-run
  // passes); a genuine failure still fails twice. CI retries more.
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',

  // The dev server compiles each lazy route on first request; give assertions
  // headroom over the 5s default so first-compile latency isn't read as failure.
  expect: { timeout: 10_000 },

  use: {
    // Dedicated e2e port so we never collide with another dev server on 4200.
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm start -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
