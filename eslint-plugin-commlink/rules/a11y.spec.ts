/* ─── why ─────────────────────────────────────────────────────────
 * One valid and one invalid case per a11y rule. Not coverage — a
 * liveness check, and it exists because the absence of one hid a dead
 * gate for as long as nobody measured it: R6's receiver regex required a
 * `Ctrl`/`Controller` suffix, `trackplay.effects.ts` named its injection
 * `#toast`, and the single actionable toast in the app went unreported.
 * A naming-convention gate decays silently as names drift, so the pair
 * that matters most here is `overlayKind`'s — every receiver spelling
 * the app actually uses is asserted below, by name.
 *
 * `inClass` is not decoration: a `#private` receiver is a parse error
 * outside a class body, so a bare `this.#toast.create(…)` fixture fails
 * as a fatal parsing error and asserts nothing about the rule. Since
 * every real call site in the app IS a `#private` field, dropping the
 * wrapper would test a shape the app never writes.
 *
 * The template rules get `@angular-eslint/template-parser` because
 * `templateParserServices` THROWS without it — the throw is why a
 * misconfigured rule fails loudly instead of passing vacuously.
 *
 * The TypeScript rules run on plain espree: they match `CallExpression`
 * and `ObjectExpression` and read no types, so typescript-eslint would
 * only add a project lookup to maintain.
 *
 * Where two reports share a fixture, they are listed in LOCATION order,
 * not the order the rule emits them — ESLint sorts by position, and the
 * element span opens before any attribute inside it.
 * ───────────────────────────────────────────────────────────────── */

import { RuleTester } from 'eslint';
import { templateParser } from 'angular-eslint';
import { rule as ariaLabelNeedsRole } from './a11y-aria-label-needs-role.ts';
import { rule as builtinNameIsTranslated } from './a11y-builtin-name-is-translated.ts';
import { rule as formControlHasLabel } from './a11y-form-control-has-label.ts';
import { rule as iconIsHiddenOrNamed } from './a11y-icon-is-hidden-or-named.ts';
import { rule as iconOnlyControlHasName } from './a11y-icon-only-control-has-name.ts';
import { rule as noActionableToastButton } from './a11y-no-actionable-toast-button.ts';
import { rule as overlayHasName } from './a11y-overlay-has-name.ts';
import { rule as overlayOptionsHaveName } from './a11y-overlay-options-have-name.ts';

const template = new RuleTester({
  languageOptions: { parser: templateParser },
});

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const create = (receiver: string, options: string): string =>
  `class Effects { ${receiver}; present() { this.${receiver}.create(${options}); } }`;

template.run('a11y-icon-is-hidden-or-named', iconIsHiddenOrNamed, {
  valid: [
    { code: '<ion-icon name="cart" aria-hidden="true"></ion-icon>' },
    { code: '<ion-icon name="cart" aria-label="Cart"></ion-icon>' },
  ],
  invalid: [
    {
      code: '<ion-icon name="cart"></ion-icon>',
      errors: [{ messageId: 'iconNeedsHiddenOrName' }],
    },
    {
      code: '<ion-icon name="cart" aria-hidden="false"></ion-icon>',
      errors: [{ messageId: 'iconNeedsHiddenOrName' }],
    },
  ],
});

template.run('a11y-icon-only-control-has-name', iconOnlyControlHasName, {
  valid: [
    {
      code: '<ion-button aria-label="Delete"><ion-icon name="trash" aria-hidden="true"></ion-icon></ion-button>',
    },
    {
      code: '<ion-button>Delete<ion-icon name="trash" aria-hidden="true"></ion-icon></ion-button>',
    },
    { code: '<ion-button><span>Delete</span></ion-button>' },
  ],
  invalid: [
    {
      code: '<ion-button><ion-icon name="trash" aria-hidden="true"></ion-icon></ion-button>',
      errors: [{ messageId: 'iconOnlyControlNeedsName' }],
    },
    {
      code: '<ion-fab-button><ion-icon name="add" aria-hidden="true"></ion-icon></ion-fab-button>',
      errors: [{ messageId: 'iconOnlyControlNeedsName' }],
    },
  ],
});

template.run('a11y-form-control-has-label', formControlHasLabel, {
  valid: [
    { code: '<ion-input label="Name"></ion-input>' },
    { code: '<ion-input aria-label="Name"></ion-input>' },
    { code: '<ion-checkbox>Confirm</ion-checkbox>' },
  ],
  invalid: [
    {
      code: '<ion-input placeholder="Name"></ion-input>',
      errors: [{ messageId: 'controlNeedsName' }],
    },
    {
      code: '<ion-toggle></ion-toggle>',
      errors: [{ messageId: 'controlNeedsName' }],
    },
  ],
});

template.run('a11y-overlay-has-name', overlayHasName, {
  valid: [
    { code: '<ion-modal aria-label="Edit player"></ion-modal>' },
    { code: '<ion-alert header="Delete?"></ion-alert>' },
    { code: '<ion-loading message="Loading"></ion-loading>' },
  ],
  invalid: [
    {
      code: '<ion-modal></ion-modal>',
      errors: [{ messageId: 'modalNeedsAriaLabel' }],
    },
    {
      code: '<ion-modal aria-labelledby="title"></ion-modal>',
      errors: [
        { messageId: 'modalNeedsAriaLabel' },
        { messageId: 'ariaLabelledbyIsInert' },
      ],
    },
    {
      code: '<ion-action-sheet></ion-action-sheet>',
      errors: [{ messageId: 'overlayNeedsNameSource' }],
    },
  ],
});

template.run('a11y-builtin-name-is-translated', builtinNameIsTranslated, {
  valid: [
    { code: '<ion-menu-button [attr.aria-label]="\'menu\' | translate" />' },
    { code: '<ion-back-button [attr.aria-label]="backLabel" />' },
  ],
  invalid: [
    {
      code: '<ion-menu-button />',
      errors: [{ messageId: 'builtinNameNeedsOverride' }],
    },
    {
      code: '<ion-back-button aria-label="Back" />',
      errors: [{ messageId: 'builtinNameNotTranslated' }],
    },
  ],
});

template.run('a11y-aria-label-needs-role', ariaLabelNeedsRole, {
  valid: [
    { code: '<div role="status" aria-label="Saved"></div>' },
    { code: '<ion-button aria-label="Delete"></ion-button>' },
  ],
  invalid: [
    {
      code: '<div aria-label="Saved"></div>',
      errors: [{ messageId: 'ariaLabelNeedsRole' }],
    },
    {
      code: '<ion-icon role="presentation" aria-label="Cart"></ion-icon>',
      errors: [{ messageId: 'ariaLabelNeedsRole' }],
    },
  ],
});

typescript.run('a11y-overlay-options-have-name', overlayOptionsHaveName, {
  valid: [
    { code: create('#alertCtrl', '{ header: "Delete?" }') },
    { code: create('#alerts', '{ message: "Gone" }') },
    { code: create('#loadingController', '{ message: "Load" }') },
    { code: create('#modalCtrl', '{ htmlAttributes: { "aria-label": "x" } }') },
    { code: create('#storageService', '{ name: "db" }') },
    { code: create('#alertCtrl', '{ ...options }') },
  ],
  invalid: [
    {
      code: create('#alertCtrl', '{ buttons: [] }'),
      errors: [{ messageId: 'overlayOptionsNeedName' }],
    },
    {
      code: create('#alerts', '{ buttons: [] }'),
      errors: [{ messageId: 'overlayOptionsNeedName' }],
    },
    {
      code: create('#modalCtrl', '{ component: Cmp }'),
      errors: [{ messageId: 'overlayOptionsNeedName' }],
    },
  ],
});

typescript.run('a11y-no-actionable-toast-button', noActionableToastButton, {
  valid: [
    { code: create('#toast', '{ message: "Saved" }') },
    {
      code: create(
        '#toast',
        '{ buttons: [{ text: "Close", role: "cancel" }] }'
      ),
    },
    {
      code: create(
        '#alertCtrl',
        '{ buttons: [{ text: "Undo", handler: undo }] }'
      ),
    },
  ],
  invalid: [
    {
      code: create('#toast', '{ buttons: [{ text: "Undo", handler: undo }] }'),
      errors: [{ messageId: 'toastButtonIsUnannounced' }],
    },
    {
      code: create(
        '#toastController',
        '{ buttons: [{ text: "Undo", handler: undo }] }'
      ),
      errors: [{ messageId: 'toastButtonIsUnannounced' }],
    },
  ],
});
