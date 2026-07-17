// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const angular = require('angular-eslint');
const ngrx = require('@ngrx/eslint-plugin/v9');
const sheriff = require('@softarc/eslint-plugin-sheriff');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig(
  globalIgnores([
    'www/**',
    'dist/**',
    'coverage/**',
    'android/**',
    'out-tsc/**',
    'projects/**',
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
    extends: [
      ...angular.configs.tsRecommended,
      ...ngrx.configs.all,
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
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.html'],
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
);
