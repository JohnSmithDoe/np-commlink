import type { Rule } from 'eslint';

// A `marker(...)` argument is a string literal, never a composed key.
//
// The i18n twin of `testid-is-static`, and the same failure shape: `i18n:extract`
// finds keys by reading `marker(...)` literals out of the source, so a key built
// at the call site is invisible to it — and because the script runs with
// `--clean`, invisible means *deleted*. That is not hypothetical here: the
// measurement that motivated declaring every family as consts found the extractor
// seeing 461 keys against 581 committed, so `--clean` would have removed 120
// across four families.
//
// The acceptance test the whole convention exists to keep passing is
// `pnpm run i18n:extract` leaving `git diff public/i18n/` clean. Composing a key
// is exactly what silently breaks it, and nothing else notices: the app still
// renders, because the composed key resolves at runtime right up until the next
// extract prunes it.
//
// A template literal with no substitutions is still reported. It is harmless
// today — the extractor may well read it — but it is one edit away from gaining a
// `${}`, and the point of the rule is that the shape stays obviously static.

const MARKER = 'marker';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'marker() takes a string literal, so i18n:extract can see the key and --clean cannot prune it.',
    },
    schema: [],
    messages: {
      markerNeedsLiteral:
        '`marker()` must take a plain string literal. A key composed at the call site is invisible to `i18n:extract`, which reads these literals out of the source — and because it runs with `--clean`, invisible means deleted on the next run. Declare the family as a `Record<TUnion, TMarker>` of literals instead (see DECK_CHROME_LABELS, UNIT_LABEL_KEYS).',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== MARKER)
          return;
        const [key] = node.arguments;
        if (!key) return;
        if (key.type === 'Literal' && typeof key.value === 'string') return;
        context.report({
          node: key as Rule.Node,
          messageId: 'markerNeedsLiteral',
        });
      },
    };
  },
};
