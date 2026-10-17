import { RuleTester } from 'eslint';
import { rule as ngrxDataLayerOnly } from './ngrx-data-layer-only.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const PAGE = 'src/app/cash/feature/cash-page/cash.page.ts';

typescript.run('ngrx-data-layer-only', ngrxDataLayerOnly, {
  valid: [
    {
      code: "import { CashFacade } from '../../data';",
      filename: PAGE,
    },
    {
      code: "import { inject } from '@angular/core';",
      filename: PAGE,
    },
    { code: "import ngrx from '@ngrx';", filename: PAGE },
    { code: 'export const ready = true;', filename: PAGE },
  ],
  invalid: [
    {
      code: "import { Store } from '@ngrx/store';",
      filename: PAGE,
      errors: [{ messageId: 'ngrxOutsideDataLayer' }],
    },
    {
      code: "import { Actions, ofType } from '@ngrx/effects';",
      filename: PAGE,
      errors: [{ messageId: 'ngrxOutsideDataLayer' }],
    },
    {
      code: "export { Store } from '@ngrx/store';",
      filename: PAGE,
      errors: [{ messageId: 'ngrxOutsideDataLayer' }],
    },
    {
      code: "export * from '@ngrx/router-store';",
      filename: PAGE,
      errors: [{ messageId: 'ngrxOutsideDataLayer' }],
    },
  ],
});
