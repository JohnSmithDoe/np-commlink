/* ─── why ─────────────────────────────────────────────────────────
 * R7 — docs/footguns.md
 *
 * Ionic hardcodes accessible names in English, which for a bilingual app
 * is a real gap rather than a curiosity. These two are the OVERRIDABLE
 * ones: `ion-menu-button` announces "menu", `ion-back-button` announces
 * "back", and both inherit `aria-label`. The searchbar's "search text",
 * the modal drag handle, the datetime's month/year buttons and the clear
 * button's "reset" are not overridable at all; those belong in a recorded
 * decision, not a workaround.
 *
 * A static `aria-label="Menü"` gets its own message: it fixes the English
 * name by hardcoding a German one, which the other language then gets
 * wrong. A binding is accepted whether or not the `translate` pipe is
 * visible in it — a component member may already hold a translated string.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  boundAttribute,
  staticAttribute,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const HARDCODED_ENGLISH_NAME: Record<string, string> = {
  'ion-menu-button': 'menu',
  'ion-back-button': 'back',
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "[Ionic a11y R7] Ionic's hardcoded English names are overridden with a translated one.",
    },
    schema: [],
    messages: {
      builtinNameNeedsOverride:
        '<{{element}}> announces the hardcoded English "{{name}}". Override it: [attr.aria-label]="\'<domain>.a11y.{{name}}\' | translate". See docs/footguns.md R7.',
      builtinNameNotTranslated:
        'aria-label on <{{element}}> is a hardcoded string, so it is wrong in the other language. Bind it through the translate pipe. See docs/footguns.md R7.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      Element(element: TemplateElement) {
        const name = HARDCODED_ENGLISH_NAME[element.name];
        if (!name) return;

        if (boundAttribute(element, 'aria-label')) return;

        const literal = staticAttribute(element, 'aria-label');
        if (literal) {
          context.report({
            loc: literal.loc,
            messageId: 'builtinNameNotTranslated',
            data: { element: element.name },
          });
          return;
        }

        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'builtinNameNeedsOverride',
          data: { element: element.name, name },
        });
      },
    };
  },
};
