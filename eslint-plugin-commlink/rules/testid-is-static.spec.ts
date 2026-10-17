import { RuleTester } from 'eslint';
import { templateParser } from 'angular-eslint';
import { rule as testidIsStatic } from './testid-is-static.ts';

const template = new RuleTester({
  languageOptions: { parser: templateParser },
});

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const HTML = 'src/app/cash/feature/cash-page/cash.page.html';
const TS = 'src/app/cash/feature/cash-page/cash.page.ts';

template.run('testid-is-static (template)', testidIsStatic, {
  valid: [
    { code: '<ion-item data-testid="list-row"></ion-item>', filename: HTML },
    {
      code: '@for (item of items; track item.id) { <ion-item data-testid="list-row">{{ item.name }}</ion-item> }',
      filename: HTML,
    },
    { code: '<ion-item [id]="item.id"></ion-item>', filename: HTML },
  ],
  invalid: [
    {
      code: '<ion-item data-testid="row-{{ item.id }}"></ion-item>',
      filename: HTML,
      errors: [{ messageId: 'composedInTemplate' }],
    },
    {
      code: '<ion-item [data-testid]="rowId"></ion-item>',
      filename: HTML,
      errors: [{ messageId: 'composedInTemplate' }],
    },
    {
      code: '<ion-item [attr.data-testid]="rowId"></ion-item>',
      filename: HTML,
      errors: [{ messageId: 'composedInTemplate' }],
    },
    {
      code: '<ion-item attr.data-testid="{{ rowId }}"></ion-item>',
      filename: HTML,
      errors: [{ messageId: 'composedInTemplate' }],
    },
  ],
});

typescript.run('testid-is-static (typescript)', testidIsStatic, {
  valid: [
    {
      code: "const options = { htmlAttributes: { 'data-testid': 'import-dialog' } };",
      filename: TS,
    },
    { code: "const row = { testid: 'row-' + id };", filename: TS },
    { code: 'const options = { component: Dialog };', filename: TS },
  ],
  invalid: [
    {
      code: "const options = { htmlAttributes: { 'data-testid': `row-${id}` } };",
      filename: TS,
      errors: [{ messageId: 'composedInTypeScript' }],
    },
    {
      code: "const options = { 'data-testid': 'row-' + id };",
      filename: TS,
      errors: [{ messageId: 'composedInTypeScript' }],
    },
    {
      code: "const options = { 'data-testid': rowId };",
      filename: TS,
      errors: [{ messageId: 'composedInTypeScript' }],
    },
  ],
});
