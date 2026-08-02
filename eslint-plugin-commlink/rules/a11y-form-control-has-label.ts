/* ─── why ─────────────────────────────────────────────────────────
 * R3 — docs/ionic-a11y-practices.md
 *
 * An `ion-label` sitting next to a control inside an `ion-item` is a
 * sibling, not an association: `ion-item` wires no `aria-labelledby`. A
 * control's name comes from its own `label` property, its own slotted
 * label, or its own `aria-label`, and from nothing else — so "it looks
 * labelled" is not a measurement.
 *
 * The sanctioned sources differ per component, which is why this is a
 * table rather than one predicate. `placeholder` is deliberately not among
 * them: it is a last-resort accname fallback, not a label, and it
 * disappears the moment the field has a value.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  hasAccessibleNameAttribute,
  hasAttribute,
  hasChildInSlot,
  hasOwnText,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

const NAME_SOURCES: Record<string, string[]> = {
  'ion-input': ['label', 'slot'],
  'ion-textarea': ['label', 'slot'],
  'ion-select': ['label', 'slot'],
  'ion-range': ['label'],
  'ion-checkbox': ['text'],
  'ion-toggle': ['text'],
};

const SOURCE_DESCRIPTIONS: Record<string, string> = {
  label: 'a `label` property',
  slot: 'a child in the `label` slot',
  text: 'slotted text',
};

const isNamed = (element: TemplateElement, sources: string[]): boolean =>
  sources.some((source) => {
    if (source === 'label') return hasAttribute(element, 'label');
    if (source === 'slot') return hasChildInSlot(element, 'label');
    return hasOwnText(element);
  });

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R3] Every Ionic form control has an accessible name of its own.',
    },
    schema: [],
    messages: {
      controlNeedsName:
        '<{{element}}> has no accessible name of its own. A neighbouring <ion-label> does not name it — `ion-item` wires no aria-labelledby. Give it {{sources}}, or an aria-label when no visible label is wanted. See docs/ionic-a11y-practices.md R3.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      Element(element: TemplateElement) {
        const sources = NAME_SOURCES[element.name];
        if (!sources) return;
        if (hasAccessibleNameAttribute(element)) return;
        if (isNamed(element, sources)) return;
        context.report({
          loc: services.convertElementSourceSpanToLoc(context, element),
          messageId: 'controlNeedsName',
          data: {
            element: element.name,
            sources: sources
              .map((source) => SOURCE_DESCRIPTIONS[source])
              .join(' or '),
          },
        });
      },
    };
  },
};
