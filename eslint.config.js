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
    // angular-eslint / @ngrx flat configs are typed against
    // @typescript-eslint/utils, whose LanguageOptions differ structurally from
    // @eslint/core's — a runtime-harmless type mismatch that only surfaces
    // under defineConfig's stricter `extends` typing (typescript-eslint#10899,
    // explicitly documented as safe to ignore). Remove once upstream aligns.
    // @ts-expect-error -- see note above
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
      // Stylistic ngrx rule the project has never followed; reducers use
      // inferred return types. Kept off to match the existing codebase.
      '@ngrx/on-function-explicit-return-type': 'off',
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
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
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
