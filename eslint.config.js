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

module.exports = defineConfig(
  globalIgnores([
    '**/.*/',
    'android/**',
    'coverage/**',
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
      // The type-aware rules. The expensive half — `projectService` above — was
      // already being paid for by @ngrx's config; nothing was reading the types
      // it produced. These four are the ones with something to catch in an app
      // built on `void p.then().catch()` and on Ionic controllers that all return
      // promises: an un-awaited promise is how a rejection becomes an
      // unhandled-rejection instead of the GlobalErrorHandler's alert, and a
      // promise-returning handler passed where void is expected is how a failure
      // vanishes entirely. Enabled by id rather than via `recommendedTypeChecked`
      // so the set is a decision, not a default that shifts under a minor bump.
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
      // A published subpath is fine — `@angular/core/testing`, `dayjs/plugin/*`,
      // `ionicons/icons` and `@ionic/angular/standalone` are the supported way
      // in. A path into a package's BUILD OUTPUT is not, and neither resolution
      // nor tsc will say so: `@ionic/core` declares no `exports` map at all, and
      // rxjs publishes `./internal/*` deliberately, so both deep paths resolved
      // silently. Two were here — `@ionic/core/dist/types/interface` (three
      // sites, one of them backing `TColor`) and `rxjs/internal/observable/
      // innerFrom` for a `fromPromise` the public `from()` already does.
      //
      // The denylist is segment names that mean "not an entry point" rather
      // than an attempt to resolve each specifier: `lib` is deliberately absent,
      // because plenty of packages publish `pkg/lib/x` as real API.
      //
      // Verified against all 15 deep specifiers in the repo: only those two are
      // caught. Extending this to specs or e2e means EDITING THIS LIST, not
      // adding the rule to a later block — flat config replaces a rule's options
      // rather than merging them, so a second `no-restricted-imports` anywhere
      // below would silently drop these patterns for the files it matches.
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
    },
  },
  {
    // Two of the four type-aware rules fire only on test doubles here, and on
    // correct ones: a stub satisfying a promise-returning signature
    // (`availability: async () => 'available'`) has nothing to await, and a
    // `mockImplementation` is passed through parameter types loose enough that a
    // returned promise reads as misused. Neither is a defect, and there were 16
    // of them against **zero** in application code.
    //
    // The other two stay on, deliberately: a forgotten `await` on an assertion is
    // exactly the bug that makes a spec pass without testing anything, and
    // `no-floating-promises` is the rule this whole set was worth enabling for.
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
