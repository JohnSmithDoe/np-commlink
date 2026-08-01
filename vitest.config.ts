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
    /**
     * These percentages are over the files some spec actually imported, NOT
     * over `src/app`. v8 leaves an unimported file out of the denominator
     * rather than scoring it zero, so ~29% of source files are invisible here
     * and the true app-wide line coverage is roughly twenty points lower.
     *
     * `coverage.include` is the documented fix and does not work under
     * `@angular/build:unit-test`: the builder runs specs from its own compiled
     * output, so an `include` glob re-instruments the on-disk sources as a
     * separate, uncovered set and the whole report collapses to 0%. Until that
     * composes, the honest reading of these numbers is "of what is under test",
     * and the thresholds are a regression floor on that subset — not a claim
     * about the app.
     */
    coverage: {
      /**
       * Templates are excluded, so the floor measures the code it is meant to
       * protect. 62 of them were in the denominator at 39% statements and 1.4%
       * functions, against 91% and 84% for the `.ts` files beside them — which
       * dragged the aggregate to 76/73.6 and left roughly eight points of room
       * for TypeScript to regress into before any threshold spoke.
       *
       * Their coverage is not a gap being hidden. Nothing here asserts rendered
       * Ionic DOM (see the note above), so a template's statements are executed
       * only incidentally, by the specs that happen to call `detectChanges()`.
       * Rendered behaviour is the e2e suite's, and a number that moves with the
       * incidental half is not a signal.
       *
       * The two i18n bundles go with them: `deck.catalog.spec.ts` imports them
       * via `resolveJsonModule`, and a data file scores a free 100%.
       */
      exclude: ['**/*.html', 'public/i18n/*.json'],
      thresholds: {
        statements: 88,
        branches: 83,
        functions: 80,
        lines: 88,
      },
    },
  },
});
