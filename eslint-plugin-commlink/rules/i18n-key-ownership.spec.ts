import { RuleTester } from 'eslint';
import { templateParser } from 'angular-eslint';
import { rule as i18nKeyOwnership } from './i18n-key-ownership.ts';

const template = new RuleTester({
  languageOptions: { parser: templateParser },
});

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const CASH_TS = 'src/app/cash/feature/cash-page/cash.page.ts';
const CASH_HTML = 'src/app/cash/feature/cash-page/cash.page.html';
const SHARED_TS = 'src/app/@shared/ui/list-header/list-header.component.ts';
const SHARED_HTML = 'src/app/@shared/ui/list-header/list-header.component.html';

typescript.run('i18n-key-ownership (typescript)', i18nKeyOwnership, {
  valid: [
    { code: "const t = marker('cash.import.title');", filename: CASH_TS },
    { code: "const t = marker('a11y.edit');", filename: CASH_TS },
    { code: "const t = marker('toast.saved');", filename: SHARED_TS },
    {
      code: "const t = marker('notifications.cta.open');",
      filename: 'src/app/tracking/data/tracking.effects.ts',
    },
    {
      code: "const t = marker('settings.theme.title');",
      filename: 'src/app/commlink/feature/settings/settings.page.ts',
    },
    {
      code: "const t = marker('household.title');",
      filename: 'src/app/app.routes.ts',
    },
    { code: "const t = 'cashier';", filename: SHARED_TS },
  ],
  invalid: [
    {
      code: "const t = marker('household.a11y.back');",
      filename: CASH_TS,
      errors: [{ messageId: 'foreignVocabulary' }],
    },
    {
      code: "const t = marker('cash.import.title');",
      filename: SHARED_TS,
      errors: [{ messageId: 'sharedVocabulary' }],
    },
    {
      code: "const t = marker('tracking.start');",
      filename: 'src/app/notifications/data/inbox.effects.ts',
      errors: [{ messageId: 'foreignVocabulary' }],
    },
    {
      code: "const t = marker('ritual.title');",
      filename: CASH_TS,
      errors: [{ messageId: 'foreignVocabulary' }],
    },
  ],
});

template.run('i18n-key-ownership (template)', i18nKeyOwnership, {
  valid: [
    {
      code: "<ion-title>{{ 'cash.import.title' | translate }}</ion-title>",
      filename: CASH_HTML,
    },
    {
      code: '<ion-button [attr.aria-label]="\'a11y.edit\' | translate"></ion-button>',
      filename: SHARED_HTML,
    },
  ],
  invalid: [
    {
      code: "<ion-title>{{ 'household.title' | translate }}</ion-title>",
      filename: CASH_HTML,
      errors: [{ messageId: 'foreignVocabulary' }],
    },
    {
      code: '<ion-button [attr.aria-label]="\'tasks.a11y.add\' | translate"></ion-button>',
      filename: SHARED_HTML,
      errors: [{ messageId: 'sharedVocabulary' }],
    },
  ],
});
