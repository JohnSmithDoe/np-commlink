import { RuleTester } from 'eslint';
import { rule as noActionTypeLiteral } from './no-action-type-literal.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

typescript.run('no-action-type-literal', noActionTypeLiteral, {
  valid: [
    { code: 'const effect = actions$.pipe(ofType(StorageActions.addItem));' },
    {
      code: 'switch (action.type) { case StorageActions.addItem.type: break; }',
    },
    { code: "const listIdByPrefix = { '[Storage]': 'storage' };" },
    { code: "console.error('[notif] error', cause);" },
    { code: "const sources = ['[Probe]'];" },
    { code: "const note = '[x] done';" },
  ],
  invalid: [
    {
      code: "if (action.type === '[Storage] addItem') run();",
      errors: [{ messageId: 'literalActionType', data: { event: 'addItem' } }],
    },
    {
      code: "switch (action.type) { case '[Storage] Add Product': break; }",
      errors: [
        { messageId: 'literalActionType', data: { event: 'Add Product' } },
      ],
    },
    {
      code: "const match = { type: '[HouseholdList] removeItem' };",
      errors: [{ messageId: 'literalActionType' }],
    },
    {
      code: "if (action.type === '[Vitals Pills] setTaken') run();",
      errors: [{ messageId: 'literalActionType', data: { event: 'setTaken' } }],
    },
  ],
});
