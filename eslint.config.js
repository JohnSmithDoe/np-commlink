// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const angular = require('angular-eslint');
const ngrx = require('@ngrx/eslint-plugin/v9');
const sheriff = require('@softarc/eslint-plugin-sheriff');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
// ESM-only plugins pulled in via require(esm); the real export is under `.default`.
const unicorn = require('eslint-plugin-unicorn').default;
const json = require('@eslint/json').default;
const markdown = require('@eslint/markdown').default;
// This project's own plugin: the mechanical half of docs/ionic-a11y-practices.md.
// Not published, not installed — required straight off the working tree.
const ionicA11y = require('./eslint-rules');

// A quoted domain-prefixed key is a `Literal` in TypeScript and a
// `LiteralPrimitive` in an Angular template — same leak, two ASTs.
const DOMAIN_KEY_NODES = ':matches(Literal, LiteralPrimitive)';

// Which i18n namespace each domain folder owns. Both gates below are derived
// from this map, so adding a domain means adding one line here.
//
// `tracking` is the one entry carrying a second prefix, and deliberately so: it
// publishes inbox rows, and the notifications port takes marker keys rather than
// copy — including the CTA's label — so the producer names keys in the inbox's
// namespace by design. The reverse exception is gone: the inbox no longer matches
// `tracking.*` command tokens to pick a label (CR-055).
const I18N_OWNERS = {
  barcode: ['barcode'],
  cash: ['cash'],
  commlink: ['commlink', 'deck'],
  geist: ['geist'],
  groceries: ['grocery'],
  notifications: ['notifications'],
  'office-time': ['office-time'],
  settings: ['settings'],
  tasks: ['tasks'],
  tracking: ['tracking', 'notifications'],
  trackplay: ['trackplay'],
};
const ALL_DOMAIN_PREFIXES = [
  ...new Set(Object.values(I18N_OWNERS).flat()),
].toSorted();
const domainKeySelector = (prefixes) =>
  String.raw`${DOMAIN_KEY_NODES}[value=/^(${prefixes.join('|')})\./]`;
const DOMAIN_KEY_MESSAGE =
  'Domain vocabulary in @shared. Use a neutral i18n namespace (categories.*, item-list.*, list-header.*, toast.*, a11y.*), or have the domain supply the key through the facade that mounts this surface.';
const FOREIGN_KEY_MESSAGE =
  "Another domain's i18n vocabulary. A key belongs to the domain that owns the wording — use this domain's own prefix, a neutral namespace (page-title.*, categories.*, item-list.*, toast.*, a11y.*), or receive the key from the owning domain through the contract that mounts this surface.";
const foreignVocabularyGate = (folder, owned) => ({
  files: [`src/app/${folder}/**/*.ts`, `src/app/${folder}/**/*.html`],
  ignores: [`src/app/${folder}/**/*.spec.ts`],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: domainKeySelector(
          ALL_DOMAIN_PREFIXES.filter((prefix) => !owned.includes(prefix))
        ),
        message: FOREIGN_KEY_MESSAGE,
      },
    ],
  },
});

module.exports = defineConfig(
  globalIgnores([
    'www/**',
    'dist/**',
    'coverage/**',
    'android/**',
    'out-tsc/**',
    'projects/**',
    '.plan-workspace/**',
    '.angular/**',
  ]),
  sheriff.configs.all,
  {
    files: ['**/*.ts'],
    extends: [...angular.configs.tsRecommended, ...ngrx.configs.all],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        // Override the `project` that @ngrx's flat config injects; use the
        // TypeScript project service so each file resolves via the tsconfig
        // that owns it (tsconfig.app.json / tsconfig.spec.json).
        project: null,
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/component-class-suffix': [
        'error',
        { suffixes: ['Page', 'Dialog', 'Component'] },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    plugins: { unicorn },
    extends: ['unicorn/all'],
    rules: {
      // `null` is idiomatic across Angular/NgRx/RxJS (form values,
      // EventEmitter<T | null>, marble tests) — not worth rewriting.
      'unicorn/no-null': 'off',
      // Stylistic renames (ev→event, idx→index, prod→production); too noisy
      // and at odds with the existing naming.
      'unicorn/prevent-abbreviations': 'off',
      // Flags domain names like `newItem`/`classX`; part of the vocabulary.
      'unicorn/no-keyword-prefix': 'off',
      // Only the argument check is unsound: it strips `undefined` from calls
      // without knowing the parameter is required (breaks `pipe.transform(undefined)`,
      // `mockResolvedValue(undefined)`, `selector.projector(state, undefined)`) and
      // erases the intent of tests that exercise the undefined path. Keep the
      // useful `return undefined` / `= undefined` checks on.
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    },
  },
  {
    // The e2e helpers probe IndexedDB directly, whose request objects are driven
    // by `onsuccess`/`onerror` handler properties. The rule flags only the error
    // half, so obeying it would leave one request half listener, half handler.
    files: ['e2e/**/*.ts'],
    rules: {
      'unicorn/prefer-add-event-listener': 'off',
    },
  },
  // ── NgRx is a data-layer implementation detail ──────────────────────────
  {
    files: ['src/app/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ngrx/*', '@ngrx/*/**'],
              message:
                'NgRx is data-layer only — dispatch/read through a domain facade, not Store directly.',
            },
          ],
        },
      ],
    },
  },
  {
    // Sanctioned NgRx homes
    files: [
      'src/app/app.providers.ts',
      'src/app/**/data/**/*.ts',
      'src/app/@shared/testing/**/*.ts',
      'src/app/**/*.spec.ts',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // ── Ionic a11y ──────────────────────────────────────────────────────────
  // The `ionic-a11y/*` rules are this project's own set (`eslint-rules/`) and
  // complete the angular-eslint one rather than duplicating it: that set keys off
  // *native* elements (`elements-content` checks `<button>`/`<a>`/headings,
  // `interactive-supports-focus` checks native interactive roles), while every
  // control in this app is a custom element Ionic defines at runtime — so enabling
  // it alone reported a clean pass over three genuinely unlabelled toolbar buttons.
  // Each rule's rationale, verified against the installed Ionic source, is in
  // docs/ionic-a11y-practices.md; the rule name carries its R-number there.
  {
    files: ['**/*.html'],
    plugins: { 'ionic-a11y': ionicA11y },
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      'ionic-a11y/icon-is-hidden-or-named': 'error',
      'ionic-a11y/icon-only-control-has-name': 'error',
      'ionic-a11y/form-control-has-label': 'error',
      'ionic-a11y/overlay-has-name': 'error',
      'ionic-a11y/builtin-name-is-translated': 'error',
      'ionic-a11y/aria-label-needs-role': 'error',
    },
  },
  {
    // The two halves of R4/R6 that live in TypeScript: an overlay presented
    // through a controller takes its name from `htmlAttributes`, not an attribute.
    files: ['src/**/*.ts'],
    plugins: { 'ionic-a11y': ionicA11y },
    rules: {
      'ionic-a11y/overlay-options-have-name': 'error',
      'ionic-a11y/no-actionable-toast-button': 'error',
    },
  },
  // ── No domain vocabulary in the domain-blind kernel ─────────────────────
  // Sheriff is structurally blind to this class: it checks import edges, and a
  // leak like `'grocery.a11y.back' | translate` inside a page that tasks and cash
  // also mount is a *string*, not an edge. It stays functionally harmless (the
  // key resolves) right up until a second domain reads the first one's wording,
  // which is the boundary the DDD re-domaining existed to draw.
  //
  // Anything genuinely shared belongs in a neutral namespace (`categories.*`,
  // `item-list.*`, `list-header.*`, `toast.*`, `a11y.*`); anything genuinely
  // domain-specific must arrive from the domain, through the facade that mounted
  // the shared surface (`listTitleKey`, `listHeader`).
  {
    // Two selectors because the two languages parse to different ASTs: a quoted
    // key is a `Literal` in TypeScript and a `LiteralPrimitive` in an Angular
    // template. Most of this class lived in templates, so scoping to `.ts` alone
    // would have been a gate that never fired.
    files: ['src/app/@shared/**/*.ts', 'src/app/@shared/**/*.html'],
    ignores: ['src/app/@shared/**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: domainKeySelector(ALL_DOMAIN_PREFIXES),
          message: DOMAIN_KEY_MESSAGE,
        },
      ],
    },
  },
  // ── …and no domain speaking another domain's vocabulary ─────────────────
  // The same leak one layer out: `barcode` shipped every user-visible string
  // under `officetime.page.settings.barcode.*` long after that settings page
  // was gone, and nothing caught it, because an i18n key is a string and
  // Sheriff only sees import edges.
  ...Object.entries(I18N_OWNERS).map(([folder, owned]) =>
    foreignVocabularyGate(folder, owned)
  ),
  // Plain JS (root config files). unicorn's native language is JS, so the
  // recommended set applies here as-is — only `prefer-module` is off because
  // this config file is legitimately CommonJS (Angular tooling convention).
  {
    files: ['**/*.js'],
    plugins: { unicorn },
    extends: ['unicorn/recommended'],
    rules: {
      'unicorn/prefer-module': 'off',
      // `project: null` in the parserOptions below is a required
      // typescript-eslint value; `null` is intentional here (as in the TS set).
      'unicorn/no-null': 'off',
    },
  },
  // JSON via @eslint/json's own rules (unicorn's cross-language rules need v72
  // + ESLint 10, which Sheriff blocks). tsconfig*.json and eslint-rules'
  // jsconfig.json carry `/* */` headers → the comment-tolerant jsonc dialect;
  // everything else is strict JSON.
  {
    files: ['**/*.json'],
    ignores: ['**/tsconfig*.json', '**/jsconfig.json'],
    language: 'json/json',
    plugins: { json },
    extends: ['json/recommended'],
  },
  {
    files: ['**/tsconfig*.json', '**/jsconfig.json'],
    language: 'json/jsonc',
    plugins: { json },
    extends: ['json/recommended'],
  },
  // Markdown prose via @eslint/markdown's recommended set (self-scopes to
  // **/*.md + the commonmark language).
  ...markdown.configs.recommended,
  {
    files: ['**/*.ts', '**/*.html'],
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  prettierConfig
);
