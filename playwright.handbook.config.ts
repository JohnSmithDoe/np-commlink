import { defineConfig, devices } from '@playwright/test';

/**
 * Temporary harness for the user handbook's screenshots — not part of the e2e
 * suite: `*.shots.ts` never matches `pnpm run e2e`'s `**\/*.e2e.ts`.
 * Mobile only; the handbook documents the app as it ships on a phone.
 */
export default defineConfig({
  testDir: './e2e/handbook',
  testMatch: '**/*.shots.ts',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: 'list',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'handbook',
      use: { ...devices['Pixel 5'], deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: 'pnpm exec ng serve --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
