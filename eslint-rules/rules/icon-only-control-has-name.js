'use strict';

const {
  containsElement,
  hasAccessibleNameAttribute,
  hasOwnText,
  templateParserServices,
} = require('../lib/template-ast');

// R2 — docs/ionic-a11y-practices.md
//
// The name goes on the interactive parent (R1), and these three elements are the
// ones Ionic does not name for us: `ion-item-option` renders a bare <button>
// (item-option.js) with no default name at all, and `ion-fab-button` is
// explicitly called out by Ionic's own docs because FABs are usually icon-only.
//
// This replaces the hand-written `ICON_BUTTON_RESTRICTION` esquery selector that
// used to live in eslint.config.js and had to be spread into every block setting
// `no-restricted-syntax` — flat config replaces a rule's options rather than
// merging them, so a selector declared once was silently dropped wherever a
// later block matched the same template. A rule cannot be dropped that way.
//
// `:has()`-style descendant tests are deliberate on both halves: text inside a
// nested `ion-label` names the control just as well, while an `aria-label` on the
// inner `ion-icon` does not — it names the icon — so that case still reports.

const DEFAULT_ELEMENTS = ['ion-button', 'ion-fab-button', 'ion-item-option'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R2] An icon-only Ionic control carries an accessible name of its own.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          elements: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      iconOnlyControlNeedsName:
        'Icon-only <{{element}}> with no accessible name. A screen reader announces it as just "button". Add [attr.aria-label]="\'<domain>.a11y.<action>\' | translate" — the icon stays decorative with aria-hidden. See docs/ionic-a11y-practices.md R2.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    const elements = context.options[0]?.elements ?? DEFAULT_ELEMENTS;
    return {
      Element(element) {
        if (!elements.includes(element.name)) return;
        if (!containsElement(element, 'ion-icon')) return;
        if (hasAccessibleNameAttribute(element) || hasOwnText(element)) return;
        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'iconOnlyControlNeedsName',
          data: { element: element.name },
        });
      },
    };
  },
};
