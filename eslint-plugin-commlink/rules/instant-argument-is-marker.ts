import type { Rule } from 'eslint';

// A key handed to `TranslateService` is a `marker(...)`, never a bare literal.
//
// The other half of `marker-argument-is-literal`. That rule guards keys that ARE
// wrapped — this one guards that they get wrapped at all, which nothing did:
// four call sites passed a plain string (`barcode.page.ts` ×2,
// `office-time-settings.page.ts` ×2) against the convention CLAUDE.md states,
// and they survived only because `@vendure/ngx-translate-extract`'s service
// parser happens to recognise this exact call shape. Nothing in the repo depended
// on that, and nothing checked it: a key composed here instead — a template
// literal, a concatenation — would have been invisible to the extractor, and
// `--clean` deletes what it cannot see.
//
// So the reason to insist on the marker is not that the extractor needs it today.
// It is that `marker(...)` is the one spelling whose visibility does not depend on
// the tool recognising the *caller*, and it is what makes a key greppable from
// its own literal.
//
// Scoping is deliberately asymmetric between the method names. `instant` is
// unambiguous — nothing else in this codebase has one — so it is checked on any
// receiver. `get` and `stream` are not: `Map.get`, `ParamMap.get` and
// `Storage.get` are all over the tree, so those two are checked only where the
// receiver reads as a translate service. A rule that guessed here would be a rule
// nobody could leave switched on.

const ALWAYS_CHECKED = new Set(['instant']);
const CHECKED_ON_TRANSLATE_RECEIVER = new Set(['get', 'stream']);
const MARKER = 'marker';
const TRANSLATE_RECEIVER = /translate/i;

// Structural rather than narrowed off `Rule.Node`: `name` lives on the same field
// whether the node is an `Identifier` (`this.translate`) or a `PrivateIdentifier`
// (`this.#translate`), and reading it as optional needs no cast at all.
type TNamed = { type: string; name?: unknown };

const named = (node: TNamed): string | undefined =>
  (node.type === 'Identifier' || node.type === 'PrivateIdentifier') &&
  typeof node.name === 'string'
    ? node.name
    : undefined;

// `translate`, `this.translate` and `this.#translate` are the three spellings in
// the tree; the last two carry the name on the member's property.
const receiverReadsAsTranslate = (
  object: TNamed & { property?: TNamed }
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
        // A `marker(...)` call is the whole point; any other non-literal is a
        // variable holding one, which `marker-argument-is-literal` already covers
        // where it is declared.
        if (
          key.type === 'CallExpression' &&
          key.callee.type === 'Identifier' &&
          key.callee.name === MARKER
        )
          return;
        // `get([A, B])` takes a list of keys, so each element is a key in its own
        // right — a literal among identifiers is exactly the leak that hides.
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
