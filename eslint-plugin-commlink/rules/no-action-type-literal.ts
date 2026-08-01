import type { Rule } from 'eslint';

// Nothing matches on an action's wire string.
//
// `'[Storage] addItem'` written out is a second copy of a name the creator
// already owns, and the two drift silently: renaming the event updates every
// `ofType` and every `case` through the creator, and leaves the literal pointing
// at an action that no longer exists — still compiling, never matching. This is
// not hypothetical. Three hardcoded `case '[Storage] Add Product'` literals in
// `grocery-list.effects` were the only thing the camelCase rename broke, which is
// exactly why they read `.type` off the creator now.
//
// Two exemptions, both from the convention as written:
//   - **Specs.** Asserting the generated `type` is pinning a wire format on
//     purpose (`expect(emitted.type).toBe('[Storage] addItem')`), which is a
//     different act from matching on it in production. Seven do.
//   - **The source prefix alone.** `'[Storage]'` is a slice identity rather than
//     an event name, and parsing it is explicitly fair game — `listIdByPrefix`
//     routes on it. So only a prefix *followed by an event* is reported.

// The source must be PascalCase, which every action group's is (`[Storage]`,
// `[GroceryList]`, `[OfficeTime]`, …). Accepting any case matched `'[notif]
// error'`, a console prefix — the shape is identical and only the convention
// tells them apart. A lowercase telemetry `source: 'recipes'` never reaches a
// bracketed string at all, so PascalCase is the whole discriminator.
const SOURCE_AND_EVENT = /^\[[A-Z][A-Za-z0-9]*]\s+\S/;

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "An action's wire type is never written as a literal — use the creator, so the name has one definition.",
    },
    schema: [],
    messages: {
      literalActionType:
        'This is an action `type` written out as a string. Match through the creator instead — `ofType(Actions.{{event}})`, or `case Actions.{{event}}.type`. A literal is a second copy of a name the creator owns: rename the event and this one keeps compiling while it stops matching, which is precisely how the camelCase rename broke three `case` statements. (Parsing the `[Source]` prefix alone is fine — that is a slice identity, not an event name.)',
    },
  },
  create(context) {
    return {
      Literal(node) {
        const { value } = node;
        if (typeof value !== 'string') return;
        const match = SOURCE_AND_EVENT.exec(value);
        if (!match) return;
        context.report({
          node,
          messageId: 'literalActionType',
          data: { event: value.slice(value.indexOf(']') + 1).trim() },
        });
      },
    };
  },
};
