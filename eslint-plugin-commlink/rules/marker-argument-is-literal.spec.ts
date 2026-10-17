import { RuleTester } from 'eslint';
import { rule as markerArgumentIsLiteral } from './marker-argument-is-literal.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

typescript.run('marker-argument-is-literal', markerArgumentIsLiteral, {
  valid: [
    { code: "const title = marker('cash.import.title');" },
    {
      code: "const LABELS = { giro: marker('cash.account.kind.giro'), cash: marker('cash.account.kind.cash') };",
    },
    { code: 'const empty = marker();' },
    { code: 'const other = translate(`cash.${kind}`);' },
  ],
  invalid: [
    {
      code: 'const key = marker(`cash.account.kind.${kind}`);',
      errors: [{ messageId: 'markerNeedsLiteral' }],
    },
    {
      code: "const key = marker('cash.account.kind.' + kind);",
      errors: [{ messageId: 'markerNeedsLiteral' }],
    },
    {
      code: 'const key = marker(`cash.import.title`);',
      errors: [{ messageId: 'markerNeedsLiteral' }],
    },
    {
      code: 'const key = marker(kindKey);',
      errors: [{ messageId: 'markerNeedsLiteral' }],
    },
  ],
});
