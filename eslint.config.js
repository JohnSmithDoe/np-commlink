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

// A quoted domain-prefixed key is a `Literal` in TypeScript and a
// `LiteralPrimitive` in an Angular template — same leak, two ASTs.
const DOMAIN_KEY_NODES = ':matches(Literal, LiteralPrimitive)';
const DOMAIN_KEY_PATTERN =
  '/^(grocery|tracking|tasks|cash|trackplay|officetime|geist)\\./';
const DOMAIN_KEY_MESSAGE =
  'Domain vocabulary in @shared. Use a neutral i18n namespace (categories.*, item-list.*, list-header.*, toast.*, a11y.*), or have the domain supply the key through the facade that mounts this surface.';

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
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
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
          selector: `${DOMAIN_KEY_NODES}[value=${DOMAIN_KEY_PATTERN}]`,
          message: DOMAIN_KEY_MESSAGE,
        },
      ],
    },
  },
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
  // + ESLint 10, which Sheriff blocks). tsconfig*.json carry `/* */` headers →
  // the comment-tolerant jsonc dialect; everything else is strict JSON.
  {
    files: ['**/*.json'],
    ignores: ['**/tsconfig*.json'],
    language: 'json/json',
    plugins: { json },
    extends: ['json/recommended'],
  },
  {
    files: ['**/tsconfig*.json'],
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
