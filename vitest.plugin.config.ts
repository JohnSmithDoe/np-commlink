/* ─── why ─────────────────────────────────────────────────────────
 * A second Vitest config, because the plugin's specs cannot join the
 * app's. `ng test` runs `@angular/build:unit-test`, whose `tsConfig` is
 * `tsconfig.spec.json` — `include` there reaches only under `src`, and
 * the builder executes specs from its OWN compiled output, so a file
 * outside `src` has no route in. Nothing about that is worth bending: a
 * rule spec needs no Angular, no jsdom and no Ionic inlining.
 *
 * These run in `node`, not jsdom: ESLint's RuleTester parses strings and
 * asserts on reports, and a DOM would only slow the boot.
 * ───────────────────────────────────────────────────────────────── */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['eslint-plugin-commlink/**/*.spec.ts'],
  },
});
