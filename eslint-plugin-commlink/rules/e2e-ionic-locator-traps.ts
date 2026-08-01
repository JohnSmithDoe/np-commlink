import type { Rule } from 'eslint';

// Two of the five Ionic locator traps, the ones decidable from a string.
//
// Their value is not in the violation count — it is zero, and has been each time
// somebody fixed them. It is that the traps get *rediscovered*: each costs a red
// spec and an hour of confusion, and neither failure names its own cause. A rule
// is the only thing that remembers.
//
// The other three traps are not string-decidable: scoping to `app-page-<x>`
// rather than `#main-content`, keying a presented overlay off its title, and the
// `goto` + `reload()` rule for re-entered routes all depend on what the spec is
// doing rather than on a literal it contains.
//
//   1. `ion-toast` is never unique. The shell mounts the service-worker update
//      prompt, and an inline overlay is in the DOM whether presented or not, so
//      `page.locator('ion-toast')` matches two and every assertion on it is a
//      strict-mode violation. `:not(.overlay-hidden)` narrows to the presented
//      one — the same class as the `ion-modal` twin.
//   2. `getByRole('dialog')` matches nothing. Ionic puts `role="dialog"` on a
//      wrapper *inside* `ion-modal`'s shadow root, not on the host, so the query
//      is silently dead — the worst kind of locator, because it fails as "not
//      found" rather than as "wrong".

const TOAST = 'ion-toast';
const NARROWED = 'overlay-hidden';

const calleeName = (node: {
  callee: { type: string; property?: { type: string; name?: string } };
}): string | undefined => {
  const { callee } = node;
  if (callee.type !== 'MemberExpression') return undefined;
  if (callee.property?.type !== 'Identifier') return undefined;
  return callee.property.name;
};

const firstStringArgument = (node: {
  arguments: { type: string; value?: unknown }[];
}): string | undefined => {
  const [first] = node.arguments;
  if (first?.type !== 'Literal') return undefined;
  return typeof first.value === 'string' ? first.value : undefined;
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'The two Ionic locator traps a string can reveal: an unnarrowed ion-toast, and a role="dialog" that matches nothing.',
    },
    schema: [],
    messages: {
      toastNotNarrowed:
        "`locator('{{selector}}')` matches more than one element: the shell mounts the service-worker update prompt, and an inline `ion-toast` is in the DOM whether presented or not — so this is a strict-mode violation as soon as anything asserts on it. Narrow to the presented one with `:not(.overlay-hidden)`; `e2e/trackplay/players.e2e.ts` is the worked example.",
      dialogRoleMatchesNothing:
        'Ionic puts `role="dialog"` on a wrapper inside `ion-modal`\'s shadow root, never on the host, so `getByRole(\'dialog\')` matches nothing and the spec fails as "not found" rather than as "wrong". Key a presented dialog off `.show-modal` plus its title — `presentedDialog` in `e2e/helpers.ts`.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const name = calleeName(node);

        if (name === 'locator') {
          const selector = firstStringArgument(node);
          if (!selector?.includes(TOAST)) return;
          if (selector.includes(NARROWED)) return;
          context.report({
            node,
            messageId: 'toastNotNarrowed',
            data: { selector },
          });
          return;
        }

        if (name === 'getByRole' && firstStringArgument(node) === 'dialog') {
          context.report({ node, messageId: 'dialogRoleMatchesNothing' });
        }
      },
    };
  },
};
