import { defineConfig } from 'vitest/config';

/**
 * Extra Vitest config merged in by the `@angular/build:unit-test` builder
 * (wired via `runnerConfig` in angular.json).
 *
 * Why this exists: `@ionic/angular/standalone` re-exports its components with
 * directory imports of `@ionic/core/components/*`, which Vitest's Node-ESM
 * resolver rejects (`Directory import ... is not supported`). Inlining Ionic,
 * Stencil and ionicons lets Vite/esbuild bundle them, so those imports resolve
 * and Ionic components can be pulled into TestBed. This is the escape hatch the
 * project's CLAUDE.md mentions for when component unit tests are wanted.
 *
 * Note: jsdom does not run the Stencil web-component runtime, so `ion-*`
 * elements render as inert custom elements. Component specs here test class
 * logic (signals/computed/methods/store dispatches), not rendered Ionic DOM —
 * rendered-UI behaviour stays in the Playwright e2e suite.
 */
export default defineConfig({
  test: {
    // Expose describe/it/expect/vi/beforeEach as globals (paired with
    // `"types": ["vitest/globals"]` in tsconfig.spec.json), so specs need no
    // per-file imports — the standard Vitest convention.
    globals: true,
    server: {
      deps: {
        inline: [/@ionic/, /@stencil/, /ionicons/],
      },
    },
  },
});
