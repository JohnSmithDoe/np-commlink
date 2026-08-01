import type { Linter } from 'eslint';
import { rules } from './rules.ts';

// `configs.all` is self-scoping: it carries its own `files`/`ignores`, so the
// consumer spreads it at top level and enables nothing rule by rule — the same
// shape angular-eslint's sets have, which is the parity this plugin was asked for.
//
// This deliberately reverses the old rule set's rule ("this exports rules only;
// which files each one applies to is decided in eslint.config.js"). That rule
// existed because a `no-restricted-syntax` *selector* could be silently dropped
// by a later block setting the same rule — flat config replaces a rule's options
// instead of merging them. Once every gate is a rule **id**, nothing can shadow
// it, and the globs are better off next to the rules that need them.

const plugin = { rules };

/** Where the a11y rules that read an Angular template AST can run at all. */
const TEMPLATE_FILES = ['**/*.html'];

/** The two halves of R4/R6 that live in TypeScript: an overlay presented through
 * a controller takes its name from `htmlAttributes`, not from an attribute. */
const OVERLAY_TS_FILES = ['src/**/*.ts'];

/** Both languages, because an i18n key leaks through either. Specs are exempt —
 * a fixture naming a foreign key is describing data, not shipping wording. */
const I18N_FILES = ['src/app/**/*.ts', 'src/app/**/*.html'];
const I18N_IGNORES = ['src/app/**/*.spec.ts'];

/** Sanctioned NgRx homes. `app.providers.ts` composes the eager kernel; `data/`
 * is the layer the rule exists to protect; the test kit and specs seed stores. */
const NGRX_ALLOWED = [
  'src/app/app.providers.ts',
  'src/app/**/data/**/*.ts',
  'src/app/@shared/testing/**/*.ts',
  'src/app/**/*.spec.ts',
];

export const all: Linter.Config[] = [
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
    files: I18N_FILES,
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
    // `marker(...)` is TS-only — the template reads keys through the pipe, which
    // takes whatever the component hands it. Specs are exempt from the second
    // rule only: a stub that echoes `instant('some.key')` is describing the
    // service's contract, not shipping a key the extractor has to find.
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
    // The action-name rules. `no-action-type-literal` exempts specs, which pin
    // the generated wire format on purpose rather than matching on it.
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
    name: 'commlink/testid-on-components',
    files: ['src/**/*.html'],
    plugins: { commlink: plugin },
    rules: { 'commlink/no-testid-on-component-element': 'error' },
  },
  {
    // Playwright only. A Vitest spec never builds these locators, and `locator`
    // / `getByRole` are common enough names that widening the glob would start
    // guessing.
    name: 'commlink/e2e-locators',
    files: ['e2e/**/*.ts'],
    plugins: { commlink: plugin },
    rules: { 'commlink/e2e-ionic-locator-traps': 'error' },
  },
  {
    // Both languages an id can be declared in: a template attribute, and the
    // `htmlAttributes` of an imperatively-created overlay. Specs are not
    // exempt — a composed id there is the half the script cannot see either.
    name: 'commlink/testid-is-static',
    files: ['src/**/*.ts', 'src/**/*.html'],
    plugins: { commlink: plugin },
    rules: { 'commlink/testid-is-static': 'error' },
  },
];
