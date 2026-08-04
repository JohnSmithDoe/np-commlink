/* ─── why ─────────────────────────────────────────────────────────
 * R1 — docs/footguns.md
 *
 * `ion-icon` renders `role="img"` on its host unconditionally and derives
 * no name from `name` (ionicons' icon.js: `h(Host, { role: 'img', … })`,
 * and the only inherited attribute is `aria-label`). An icon with neither
 * attribute is therefore an image role with no accessible name — axe-core's
 * `role-img-alt` flags it and what a reader announces is
 * implementation-defined. There is no third state, which is why
 * `aria-hidden="true"` is the default rather than an optimisation.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  boundAttribute,
  hasAccessibleNameAttribute,
  staticAttribute,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const isHidden = (element: TemplateElement): boolean => {
  if (boundAttribute(element, 'aria-hidden')) return true;
  const hidden = staticAttribute(element, 'aria-hidden');
  return hidden !== undefined && hidden.value !== 'false';
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R1] Every <ion-icon> is either hidden from assistive technology or carries its own name.',
    },
    schema: [],
    messages: {
      iconNeedsHiddenOrName:
        '<ion-icon> renders role="img" with no name of its own. Add aria-hidden="true" when the icon is decorative (the usual case — the interactive parent carries the name), or an aria-label when the icon *is* the content. See docs/footguns.md R1.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      'Element[name="ion-icon"]'(element: TemplateElement) {
        if (isHidden(element) || hasAccessibleNameAttribute(element)) return;
        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'iconNeedsHiddenOrName',
        });
      },
    };
  },
};
