/* ─── why ─────────────────────────────────────────────────────────
 * R4, declarative half — docs/footguns.md
 *
 * Ionic assigns the overlay roles; the NAME is ours whenever there is no
 * header or message for Ionic to derive one from. `ion-modal` never has
 * one: it puts `role="dialog"` + `aria-modal="true"` on a shadow wrapper
 * and derives no name at all.
 *
 * `ion-modal` takes `aria-label`, not `aria-labelledby`, and the second
 * earns its own message because Ionic's docs suggest it while the
 * installed version cannot honour it: `modal.js` declares
 * `attributesToInherit = ['aria-label', 'role']`, so `aria-labelledby` is
 * neither forwarded to the wrapper that holds the role, nor able to
 * resolve an IDREF across the shadow boundary. It reads as a label and is
 * inert.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  boundAttribute,
  hasAttribute,
  staticAttribute,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const REQUIRES_ARIA_LABEL = 'ion-modal';

const DERIVES_NAME_FROM: Record<string, string> = {
  'ion-action-sheet': 'header',
  'ion-loading': 'message',
  'ion-alert': 'header',
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R4] Every Ionic overlay has a name — its own, or one Ionic can derive.',
    },
    schema: [],
    messages: {
      modalNeedsAriaLabel:
        '<ion-modal> is role="dialog" with no name — Ionic derives none. Add aria-label (keep it in sync with the visible ion-title: one translated key read by both). See docs/footguns.md R4.',
      ariaLabelledbyIsInert:
        'aria-labelledby on <ion-modal> is inert: modal.js inherits only aria-label and role, and an IDREF cannot cross the shadow boundary to the wrapper that holds role="dialog". Use aria-label. See docs/footguns.md R4.',
      overlayNeedsNameSource:
        '<{{element}}> has no `{{source}}` for Ionic to derive a name from, and no aria-label of its own. See docs/footguns.md R4.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      Element(element: TemplateElement) {
        if (element.name === REQUIRES_ARIA_LABEL) {
          const labelledby =
            staticAttribute(element, 'aria-labelledby') ??
            boundAttribute(element, 'aria-labelledby');
          if (labelledby) {
            context.report({
              loc: labelledby.loc,
              messageId: 'ariaLabelledbyIsInert',
            });
          }
          if (!hasAttribute(element, 'aria-label')) {
            context.report({
              loc: services.convertElementSourceSpanToLoc(context, element),
              messageId: 'modalNeedsAriaLabel',
            });
          }
          return;
        }

        const source = DERIVES_NAME_FROM[element.name];
        if (!source) return;
        if (hasAttribute(element, source)) return;
        if (hasAttribute(element, 'aria-label')) return;
        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'overlayNeedsNameSource',
          data: { element: element.name, source },
        });
      },
    };
  },
};
