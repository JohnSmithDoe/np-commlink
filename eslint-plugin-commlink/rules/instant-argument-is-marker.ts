/* ─── why ─────────────────────────────────────────────────────────
 * The other half of `marker-argument-is-literal`. That rule guards keys
 * that ARE wrapped; this one guards that they get wrapped at all, which
 * nothing did: four call sites passed a plain string (`barcode.page.ts` ×2,
 * `office-time-settings.page.ts` ×2) against the convention CLAUDE.md
 * states, and they survived only because `@vendure/ngx-translate-extract`'s
 * service parser happens to recognise this exact call shape.
 *
 * So the reason to insist on the marker is not that the extractor needs it
 * today. It is that `marker(...)` is the one spelling whose visibility
 * does not depend on the tool recognising the CALLER, and it is what makes
 * a key greppable from its own literal. A key composed here instead — a
 * template literal, a concatenation — would be invisible, and `--clean`
 * deletes what it cannot see.
 *
 * Scoping is deliberately asymmetric between the method names. `instant`
 * is unambiguous — nothing else in this codebase has one — so it is
 * checked on any receiver. `get` and `stream` are not: `Map.get`,
 * `ParamMap.get` and `Storage.get` are all over the tree, so those two are
 * checked only where the receiver reads as a translate service. A rule
 * that guessed here would be a rule nobody could leave switched on.
 *
 * `get([A, B])` takes a LIST of keys, so each element is a key in its own
 * right — a bare literal among marker calls is exactly the leak that hides.
 *
 * The node types here are structural rather than narrowed off `Rule.Node`:
 * `name` lives on the same field whether the node is an `Identifier`
 * (`this.translate`) or a `PrivateIdentifier` (`this.#translate`), and
 * reading it as optional needs no cast at all.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const ALWAYS_CHECKED = new Set(['instant']);
const CHECKED_ON_TRANSLATE_RECEIVER = new Set(['get', 'stream']);
const MARKER = 'marker';
const TRANSLATE_RECEIVER = /translate/i;

type Named = { type: string; name?: unknown };

const named = (node: Named): string | undefined =>
  (node.type === 'Identifier' || node.type === 'PrivateIdentifier') &&
  typeof node.name === 'string'
    ? node.name
    : undefined;

const receiverReadsAsTranslate = (
  object: Named & { property?: Named }
): boolean => {
  const direct = named(object);
  if (direct !== undefined) return TRANSLATE_RECEIVER.test(direct);
  const property = object.property ? named(object.property) : undefined;
  return property !== undefined && TRANSLATE_RECEIVER.test(property);
};

const isBareKey = (node: { type: string }): boolean =>
  (node.type === 'Literal' &&
    typeof (node as { value?: unknown }).value === 'string') ||
  node.type === 'TemplateLiteral';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'An i18n key reaching TranslateService is a marker(), so the extractor sees it without having to recognise the caller.',
    },
    schema: [],
    messages: {
      keyNeedsMarker:
        'Wrap this key in `marker(...)`. A bare literal here is only found by `i18n:extract` because its service parser recognises this call shape — and `--clean` deletes every key it does not find. `marker()` is the spelling whose visibility does not depend on that, and it keeps the key greppable from its own literal.',
    },
  },
  create(context) {
    const report = (node: { type: string }) =>
      context.report({ node: node as Rule.Node, messageId: 'keyNeedsMarker' });

    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== 'MemberExpression' || callee.computed) return;
        const method = named(callee.property);
        if (method === undefined) return;

        const checked =
          ALWAYS_CHECKED.has(method) ||
          (CHECKED_ON_TRANSLATE_RECEIVER.has(method) &&
            receiverReadsAsTranslate(callee.object));
        if (!checked) return;

        const [key] = node.arguments;
        if (!key) return;
        if (
          key.type === 'CallExpression' &&
          key.callee.type === 'Identifier' &&
          key.callee.name === MARKER
        )
          return;
        if (key.type === 'ArrayExpression') {
          for (const element of key.elements)
            if (element && isBareKey(element)) report(element);
          return;
        }
        if (isBareKey(key)) report(key);
      },
    };
  },
};
