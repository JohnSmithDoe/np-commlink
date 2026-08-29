// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const angular = require('angular-eslint');
const ngrx = require('@ngrx/eslint-plugin/v9');
const sheriff = require('@softarc/eslint-plugin-sheriff');
const commlink = require('./eslint-plugin-commlink');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const unicorn = require('eslint-plugin-unicorn').default;
// Registered by name here because the four type-aware rules below are set in
// THIS block: `extends` scopes a plugin to the config element that declared it,
// so inheriting the preset does not make `@typescript-eslint/*` resolvable in a
// sibling `rules`.
const tseslint = require('typescript-eslint');
const json = require('@eslint/json').default;
const markdown = require('@eslint/markdown').default;

// `input()`, `output()`, `model()` and the `*Child*` queries each return a
// binding object Angular captures once and holds by reference. Reassigning the
// property never rebinds anything — it detaches the member from the binding
// still feeding the template, and neither tsc nor the template type-checker
// says a word. `readonly` is the declaration that makes the reassignment
// impossible, and it was already true of 147 of the repo's 157 such members.
//
// Two selectors because the required forms are a different AST: `input()` is a
// bare callee, `input.required()` a member expression. Upstream's
// `prefer-output-readonly` covers only the `@Output()` decorator, which this
// repo does not use.
//
// SPREAD THIS, never re-declare `no-restricted-syntax` in a later block: flat
// config replaces a rule's options rather than merging them, so a second
// declaration silently drops these for every file it matches.
const READONLY_SIGNAL_MEMBERS = [
  {
    selector:
      'PropertyDefinition:not([readonly=true]) > CallExpression.value[callee.name=/^(input|output|model|viewChild|viewChildren|contentChild|contentChildren)$/]',
    message:
      'Declare this readonly — an input/output/query holds a binding Angular captured by reference, so reassigning it detaches the binding instead of changing it.',
  },
  {
    selector:
      'PropertyDefinition:not([readonly=true]) > CallExpression.value[callee.object.name=/^(input|model|viewChild|viewChildren|contentChild|contentChildren)$/][callee.property.name="required"]',
    message:
      'Declare this readonly — an input/output/query holds a binding Angular captured by reference, so reassigning it detaches the binding instead of changing it.',
  },
];

module.exports = defineConfig(
  globalIgnores([
    '**/.*/',
    'android/**',
    'coverage/**',
    // Gitignored scratch docs — transient by the `current-` prefix.
    'current-*.md',
    'dist/**',
    'out-tsc/**',
    'playwright-report/**',
    'test-results/**',
    'www/**',
  ]),
  sheriff.configs.all,
  {
    files: ['**/*.ts'],
    plugins: { unicorn, '@typescript-eslint': tseslint.plugin },
    extends: [
      ...angular.configs.tsRecommended,
      ...ngrx.configs.all,
      unicorn.configs.all,
      ...commlink.configs.tsRecommended,
    ],
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
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      // `null` is idiomatic across Angular/NgRx/RxJS
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: { utils: true, prod: true },
          ignore: ['e2e', 'Ref', 'componentProps'],
        },
      ],
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
      'unicorn/prefer-export-from': ['error', { checkUsedVariables: false }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/dist/**', '**/internal/**', '**/src/**', '**/esm/**'],
              message:
                "Import from the package root or a published subpath — a path into a package's build output is not an entry point and can move in a patch release.",
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...READONLY_SIGNAL_MEMBERS],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    // `util/` is the pure layer, and `type:ui` may reach it. That combination is
    // only sound while `util/` holds no state: the moment a signal lives behind
    // an `@Injectable` there, a dumb component can read store-derived state
    // through a channel Sheriff cannot see — it sees `data -> util` and
    // `ui -> util` as two unrelated legal edges, never the channel between them.
    // Hahnekamp's `type:data` is "state management AND the services that hold
    // it"; his `util` is pure functions. This is that line, enforced.
    //
    // A `@Pipe` is deliberately still legal: a pure pipe IS a pure function with
    // a decorator. Module-level side effects are legal too — `marker(...)` and
    // `dayjs.extend(...)` are both idiomatic here, and a rule needing two
    // carve-outs to catch one real case is not worth the carve-outs.
    files: ['src/app/*/util/**/*.ts', 'src/app/@shared/util/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...READONLY_SIGNAL_MEMBERS,
        {
          selector: 'Decorator[expression.callee.name="Injectable"]',
          message:
            'util/ holds no injectable service — a service that holds state or reaches a platform API belongs in data/. See CLAUDE.md.',
        },
      ],
    },
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      'unicorn/prefer-add-event-listener': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      ...commlink.configs.templateRecommended,
    ],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/attributes-order': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/no-inline-styles': [
        'error',
        { allowBindToStyle: true },
      ],
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { unicorn },
    extends: ['unicorn/recommended'],
    rules: {
      'unicorn/prefer-module': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: { utils: true, prod: true },
          ignore: [
            'e2e',
            'isE2e',
            'Ref',
            'componentProps',
            'dir',
            'rel',
            'doc',
          ],
        },
      ],
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
      'unicorn/import-style': [
        'error',
        { styles: { 'node:path': { named: true } } },
      ],
    },
  },
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
