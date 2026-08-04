/* ─── why ─────────────────────────────────────────────────────────
 * Three sets, self-scoping: each carries its own `files`/`ignores`, so a
 * consumer enables nothing rule by rule. `tsRecommended` and
 * `templateRecommended` borrow angular-eslint's names because they mean
 * the same thing and sit in the same `extends` arrays; every rule is
 * `error` in all three, so `all` is their union rather than a stricter
 * tier.
 *
 * Split by LANGUAGE because `extends` applies the enclosing block's
 * `files` to everything it extends. A template-scoped config nested under
 * a TypeScript-scoped parent intersects to nothing, and the failure is
 * silent: measured, all nine template rules went inert while every `.ts`
 * file kept exactly the rules it had and the suite stayed green.
 *
 * The globs live here, reversing the old rule set's "this exports rules
 * only, the config decides which files". That rule guarded against a
 * `no-restricted-syntax` *selector* being dropped by a later block setting
 * the same rule — an argument about shared option bags, not about rule
 * ids, which cannot be shadowed that way. Nothing here should exist at all
 * if an upstream rule expresses the same check; CLAUDE.md
 * has the order to try, under Enforced > ESLint.
 *
 * Why each scope is drawn where it is:
 *   - `marker(...)` is TS-only — a template reads keys through the pipe,
 *     which takes whatever the component hands it.
 *   - i18n-key-ownership runs on both languages, because a key leaks
 *     through either. Specs are exempt: a fixture naming a foreign key is
 *     describing data, not shipping wording.
 *   - instant-argument-is-marker exempts specs too — a stub echoing
 *     `instant('some.key')` describes the service's contract.
 *   - no-action-type-literal exempts specs, which pin the generated wire
 *     format on purpose rather than matching on it.
 *   - testid-is-static does NOT exempt specs: a composed id there is the
 *     half scripts/check-testids.mjs cannot see either.
 *   - e2e-ionic-locator-traps is Playwright-only. A Vitest spec never
 *     builds these locators, and `locator` / `getByRole` are common enough
 *     names that widening the glob would start guessing.
 *   - comments-header-only is the one rule with no narrowing and no
 *     `ignores` at all — not specs, not e2e, not this plugin's own
 *     sources. A header block only reads as a signal if it means the same
 *     thing in every file, so a carve-out is a region where it means
 *     nothing. Every-TS-file intersected with the consumer's own glob is
 *     the 587 files ng lint passes; it is TS-only because a template has
 *     no first code token to sit above.
 *   - The NgRx allowlist is an `ignores:` glob rather than rule options:
 *     ESLint already does glob matching, and `app.providers.ts` earns its
 *     entry by composing the eager kernel.
 * ───────────────────────────────────────────────────────────────── */

import type { Linter } from 'eslint';
import { rules } from './rules.ts';

const plugin = { rules };

const TEMPLATE_FILES = ['**/*.html'];

const OVERLAY_TS_FILES = ['src/**/*.ts'];

const I18N_TS_FILES = ['src/app/**/*.ts'];
const I18N_TEMPLATE_FILES = ['src/app/**/*.html'];
const I18N_IGNORES = ['src/app/**/*.spec.ts'];

const NGRX_ALLOWED = [
  'src/app/app.providers.ts',
  'src/app/**/data/**/*.ts',
  'src/app/@shared/testing/**/*.ts',
  'src/app/**/*.spec.ts',
];

export const tsRecommended: Linter.Config[] = [
  {
    name: 'commlink/a11y-overlay-controllers',
    files: OVERLAY_TS_FILES,
    plugins: { commlink: plugin },
    rules: {
      'commlink/a11y-overlay-options-have-name': 'error',
      'commlink/a11y-no-actionable-toast-button': 'error',
    },
  },
  {
    name: 'commlink/i18n-key-ownership',
    files: I18N_TS_FILES,
    ignores: I18N_IGNORES,
    plugins: { commlink: plugin },
    rules: { 'commlink/i18n-key-ownership': 'error' },
  },
  {
    name: 'commlink/ngrx-data-layer-only',
    files: ['src/app/**/*.ts'],
    ignores: NGRX_ALLOWED,
    plugins: { commlink: plugin },
    rules: { 'commlink/ngrx-data-layer-only': 'error' },
  },
  {
    name: 'commlink/i18n-marker',
    files: ['src/**/*.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/marker-argument-is-literal': 'error' },
  },
  {
    name: 'commlink/i18n-instant-marker',
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/**/*.spec.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/instant-argument-is-marker': 'error' },
  },
  {
    name: 'commlink/action-names',
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/**/*.spec.ts'],
    plugins: { commlink: plugin },
    rules: {
      'commlink/action-event-keys-are-identifiers': 'error',
      'commlink/no-action-type-literal': 'error',
    },
  },
  {
    name: 'commlink/layout',
    files: ['src/**/index.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/no-barrel-outside-data': 'error' },
  },
  {
    name: 'commlink/spec-hygiene',
    files: ['src/**/*.spec.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/spec-resets-mock-selectors': 'error' },
  },
  {
    name: 'commlink/e2e-locators',
    files: ['e2e/**/*.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/e2e-ionic-locator-traps': 'error' },
  },
  {
    name: 'commlink/testid-is-static',
    files: ['src/**/*.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/testid-is-static': 'error' },
  },
  {
    name: 'commlink/comments-header-only',
    files: ['**/*.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/comments-header-only': 'error' },
  },
];

export const templateRecommended: Linter.Config[] = [
  {
    name: 'commlink/a11y-template',
    files: TEMPLATE_FILES,
    plugins: { commlink: plugin },
    rules: {
      'commlink/a11y-icon-is-hidden-or-named': 'error',
      'commlink/a11y-icon-only-control-has-name': 'error',
      'commlink/a11y-form-control-has-label': 'error',
      'commlink/a11y-overlay-has-name': 'error',
      'commlink/a11y-builtin-name-is-translated': 'error',
      'commlink/a11y-aria-label-needs-role': 'error',
    },
  },
  {
    name: 'commlink/i18n-key-ownership-template',
    files: I18N_TEMPLATE_FILES,
    ignores: I18N_IGNORES,
    plugins: { commlink: plugin },
    rules: { 'commlink/i18n-key-ownership': 'error' },
  },
  {
    name: 'commlink/testid-on-components',
    files: ['src/**/*.html'],
    plugins: { commlink: plugin },
    rules: { 'commlink/no-testid-on-component-element': 'error' },
  },
  {
    name: 'commlink/testid-is-static-template',
    files: ['src/**/*.html'],
    plugins: { commlink: plugin },
    rules: { 'commlink/testid-is-static': 'error' },
  },
];

export const all: Linter.Config[] = [...tsRecommended, ...templateRecommended];
