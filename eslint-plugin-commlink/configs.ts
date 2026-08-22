/* ─── why ─────────────────────────────────────────────────────────
 * Three sets, self-scoping: each carries its own `files`/`ignores`, so a
 * consumer enables nothing rule by rule. `tsRecommended` and
 * `templateRecommended` borrow angular-eslint's names because they mean
 * the same thing and sit in the same `extends` arrays; every rule is
 * `error` in all three, so `all` is their union, not a stricter tier.
 *
 * Split by LANGUAGE because `extends` applies the enclosing block's
 * `files` to everything it extends. A template-scoped config nested under
 * a TypeScript-scoped parent intersects to nothing, and the failure is
 * silent: measured, all nine template rules went inert while every `.ts`
 * file kept its rules and the suite stayed green.
 *
 * The globs live here, not in the consumer's config: a rule id cannot be
 * shadowed by a later block the way a shared option bag can.
 *
 * Why each scope is drawn where it is:
 *   - `marker(...)` is TS-only — a template reads keys through the pipe.
 *   - i18n-key-ownership runs on both languages, because a key leaks
 *     through either. It exempts specs, as do instant-argument-is-marker
 *     and no-action-type-literal: a fixture naming a foreign key or a
 *     pinned wire format is describing data, not shipping it.
 *   - testid-is-static does NOT exempt specs: a composed id there is the
 *     half scripts/check-testids.mjs cannot see either.
 *   - e2e-ionic-locator-traps is Playwright-only; `locator` and
 *     `getByRole` are common enough names that widening would guess.
 *   - comments-header-only has no narrowing and no `ignores` at all: a
 *     header block only reads as a signal if it means the same thing in
 *     every file, so a carve-out is a region where it means nothing. It
 *     is TS-only — a template has no first code token to sit above.
 *   - The NgRx allowlist is an `ignores:` glob, not rule options.
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
