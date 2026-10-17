import { RuleTester } from 'eslint';
import { templateParser } from 'angular-eslint';
import { rule as noTestidOnComponentElement } from './no-testid-on-component-element.ts';

const template = new RuleTester({
  languageOptions: { parser: templateParser },
});

template.run('no-testid-on-component-element', noTestidOnComponentElement, {
  valid: [
    { code: '<app-tracking-item [item]="item"></app-tracking-item>' },
    { code: '<ion-button data-testid="save-button">Save</ion-button>' },
    { code: '<ion-item data-testid="list-row"></ion-item>' },
    { code: '<app-text-item [data-testid]="rowId"></app-text-item>' },
    {
      code: '@if (open) { <ion-list><ion-item data-testid="list-row"></ion-item></ion-list> }',
    },
  ],
  invalid: [
    {
      code: '<app-tracking-item data-testid="tracking-row"></app-tracking-item>',
      errors: [
        {
          messageId: 'redundantTestid',
          data: { element: 'app-tracking-item' },
        },
      ],
    },
    {
      code: '@for (item of items; track item.id) { <app-text-item data-testid="text-row" /> }',
      errors: [
        { messageId: 'redundantTestid', data: { element: 'app-text-item' } },
      ],
    },
  ],
});
