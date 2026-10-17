import { RuleTester } from 'eslint';
import { rule as e2eIonicLocatorTraps } from './e2e-ionic-locator-traps.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const SPEC = 'e2e/trackplay/players.e2e.ts';

typescript.run('e2e-ionic-locator-traps', e2eIonicLocatorTraps, {
  valid: [
    {
      code: "await expect(page.locator('ion-toast:not(.overlay-hidden)')).toHaveCount(0);",
      filename: SPEC,
    },
    {
      code: "await dialog.getByRole('button', { name: CREATE_BUTTON }).click();",
      filename: SPEC,
    },
    {
      code: "const dialog = page.locator('ion-modal.show-modal');",
      filename: SPEC,
    },
    { code: 'const toast = page.locator(TOAST);', filename: SPEC },
    { code: 'const dialog = page.getByRole(role);', filename: SPEC },
  ],
  invalid: [
    {
      code: "await expect(page.locator('ion-toast')).toBeVisible();",
      filename: SPEC,
      errors: [
        { messageId: 'toastNotNarrowed', data: { selector: 'ion-toast' } },
      ],
    },
    {
      code: "const toast = page.locator('ion-app ion-toast.toast-bottom');",
      filename: SPEC,
      errors: [{ messageId: 'toastNotNarrowed' }],
    },
    {
      code: "const dialog = page.getByRole('dialog');",
      filename: SPEC,
      errors: [{ messageId: 'dialogRoleMatchesNothing' }],
    },
    {
      code: "const dialog = page.getByRole('dialog', { name: 'Edit player' });",
      filename: SPEC,
      errors: [{ messageId: 'dialogRoleMatchesNothing' }],
    },
  ],
});
