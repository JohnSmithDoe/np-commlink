import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright end-to-end configuration for np-commlink.
 *
 * The suite drives the web build of the Ionic app via `ng serve` (dev
 * configuration). A single Chromium project with a mobile viewport mirrors the
 * primary Capacitor/Android target. Routes are reached by hash URLs
 * (`withHashLocation()`), e.g. `/#/household/storage/_storage`.
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
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',

  // The dev server compiles each lazy route on first request; give assertions
  // headroom over the 5s default so first-compile latency isn't read as failure.
  expect: { timeout: 10_000 },

  use: {
    // Dedicated e2e port so we never collide with another dev server on 4200.
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Two projects rather than one matrix: the suite mirrors the Capacitor/Android
  // target, so everything runs mobile EXCEPT the surfaces gated to desktop. The
  // emoji picker is one (`Platform.is('desktop')` — a mobile keyboard already
  // has one), and its trigger simply does not render on a Pixel 5, so its spec
  // can only ever run in the desktop project. Partitioned by file rather than
  // run twice, so the suite stays a single pass.
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      testIgnore: '**/desktop/**',
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/desktop/**',
    },
  ],

  webServer: {
    command: 'pnpm exec ng serve --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
