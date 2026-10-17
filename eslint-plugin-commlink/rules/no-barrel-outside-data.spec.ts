import { RuleTester } from 'eslint';
import { rule as noBarrelOutsideData } from './no-barrel-outside-data.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const code = "export * from './cash.facade';";

typescript.run('no-barrel-outside-data', noBarrelOutsideData, {
  valid: [
    { code, filename: 'src/app/cash/data/index.ts' },
    { code, filename: 'src/app/@shared/data/index.ts' },
    {
      code,
      filename: '/home/dev/np-commlink/src/app/office-time/data/index.ts',
    },
    { code, filename: String.raw`C:\np-commlink\src\app\tasks\data\index.ts` },
    { code, filename: 'src/app/cash/data/cash.facade.ts' },
    { code, filename: 'src/app/cash/model/reindex.ts' },
  ],
  invalid: [
    {
      code,
      filename: 'src/app/cash/model/index.ts',
      errors: [{ messageId: 'unexpectedBarrel' }],
    },
    {
      code,
      filename: 'src/app/@shared/util/index.ts',
      errors: [{ messageId: 'unexpectedBarrel' }],
    },
    {
      code,
      filename: 'src/app/cash/data/accounts/index.ts',
      errors: [{ messageId: 'unexpectedBarrel' }],
    },
    {
      code,
      filename: 'src/app/cash/feature/index.ts',
      errors: [{ messageId: 'unexpectedBarrel' }],
    },
  ],
});
