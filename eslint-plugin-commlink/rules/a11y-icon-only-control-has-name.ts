/* ─── why ─────────────────────────────────────────────────────────
 * R2 — docs/ionic-a11y-practices.md
 *
 * The name goes on the interactive parent (R1), and these three are the
 * ones Ionic does not name for us: `ion-item-option` renders a bare
 * `<button>` (item-option.js) with no default name at all, and
 * `ion-fab-button` is called out by Ionic's own docs because FABs are
 * usually icon-only.
 *
 * Descendant tests on both halves are deliberate: text inside a nested
 * `ion-label` names the control just as well, while an `aria-label` on the
 * inner `ion-icon` does not — that names the icon — so this case still
 * reports.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  containsElement,
  hasAccessibleNameAttribute,
  hasOwnText,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const DEFAULT_ELEMENTS = ['ion-button', 'ion-fab-button', 'ion-item-option'];

interface Options {
  elements?: string[];
}

export const rule: Rule.RuleModule = {
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
    const elements =
      (context.options[0] as Options | undefined)?.elements ?? DEFAULT_ELEMENTS;
    return {
      Element(element: TemplateElement) {
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
