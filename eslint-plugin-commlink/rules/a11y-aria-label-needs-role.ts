/* ─── why ─────────────────────────────────────────────────────────
 * R8 — docs/footguns.md
 *
 * `aria-label` on an element whose role prohibits naming is not merely
 * ignored — it is prohibited by ARIA and flagged by axe-core's
 * `aria-prohibited-attr`. The label is simply not exposed, so the element
 * reads as unnamed while the source says otherwise. A themed HUD is
 * exactly where this happens: the name goes onto the `<span>` that carries
 * the glow. The fix is a role that permits a name (`role="img"` for a
 * glyph or a count, `role="status"` for a live value) or real text in a
 * visually-hidden span.
 *
 * The one rule here that is not Ionic-specific. `presentation` / `none` /
 * `generic` are listed because they *remove* the naming capability an
 * element would otherwise have had.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  ACCESSIBLE_NAME_ATTRIBUTES,
  hasAnyAttribute,
  hasAttribute,
  staticAttribute,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const ROLELESS_ELEMENTS = new Set([
  'div',
  'span',
  'p',
  'em',
  'strong',
  'code',
  'sub',
  'sup',
  'del',
  'ins',
]);
const NAME_PROHIBITING_ROLES = new Set(['presentation', 'none', 'generic']);

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R8] aria-label is only used where the role permits a name.',
    },
    schema: [],
    messages: {
      ariaLabelNeedsRole:
        'aria-label on <{{element}}> is prohibited by ARIA{{because}}, so the name is never exposed. Add a role that permits naming (role="img" for a glyph or count, role="status" for a live value), or use real text in a visually-hidden span. See docs/footguns.md R8.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      Element(element: TemplateElement) {
        if (!hasAnyAttribute(element, ACCESSIBLE_NAME_ATTRIBUTES)) return;

        const role = staticAttribute(element, 'role')?.value;
        const prohibiting = NAME_PROHIBITING_ROLES.has(role ?? '');
        const roleless =
          ROLELESS_ELEMENTS.has(element.name) && !hasAttribute(element, 'role');
        if (!prohibiting && !roleless) return;

        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'ariaLabelNeedsRole',
          data: {
            element: element.name,
            because: prohibiting
              ? ` — role="${role}" removes the naming capability`
              : ' — the implicit `generic` role does not support naming',
          },
        });
      },
    };
  },
};
