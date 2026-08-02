/* ─── why ─────────────────────────────────────────────────────────
 * Nothing matches on an action's wire string. `'[Storage] addItem'`
 * written out is a second copy of a name the creator already owns, and the
 * two drift silently: renaming the event updates every `ofType` and every
 * `case` through the creator, and leaves the literal pointing at an action
 * that no longer exists — still compiling, never matching. Not
 * hypothetical: three hardcoded `case '[Storage] Add Product'` literals in
 * `household-list.effects` were the only thing the camelCase rename broke,
 * which is exactly why they read `.type` off the creator now.
 *
 * Two exemptions, both from the convention as written. SPECS assert the
 * generated `type` to pin a wire format on purpose, which is a different
 * act from matching on it in production; seven do. And the SOURCE PREFIX
 * alone (`'[Storage]'`) is a slice identity rather than an event name —
 * `listIdByPrefix` routes on it — so only a prefix followed by an event is
 * reported.
 *
 * The source must be PascalCase. Accepting any case matched `'[notif]
 * error'`, a console prefix whose shape is identical and which only the
 * convention tells apart; a lowercase telemetry `source: 'recipes'` never
 * reaches a bracketed string at all, so the casing is the whole
 * discriminator.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

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
