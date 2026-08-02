/* ─── why ─────────────────────────────────────────────────────────
 * A spec that overrides a MockStore selector puts it back. Facades are
 * `providedIn: 'root'` and spec files share a module registry, so an
 * override outlives the file that set it. The failure mode is the
 * expensive kind: the spec that set it passes, and some OTHER file — often
 * one that never mentions the selector — fails, or worse passes for the
 * wrong reason. Running the offending spec alone reproduces nothing.
 *
 * Same-file is the whole contract, which is what makes this decidable per
 * file: `resetSelectors` is not called from `@shared/testing/` or any
 * setup file, so there is no shared teardown a spec could be relying on
 * instead. A reset may legitimately be written after the override, so the
 * verdict is only knowable at `Program:exit`.
 *
 * The check is deliberately shallow — it asks whether the file mentions
 * `resetSelectors` at all, not whether it is wired into a correct
 * `afterEach`. Anything stricter starts guessing at test structure, and
 * the residual case (a `resetSelectors` sitting somewhere that never runs)
 * is visible in review while the absent one is not.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const OVERRIDE = 'overrideSelector';
const RESET = 'resetSelectors';

const calleeName = (node: {
  callee: { type: string; property?: { type: string; name?: string } };
}): string | undefined => {
  const { callee } = node;
  if (callee.type !== 'MemberExpression') return undefined;
  if (callee.property?.type !== 'Identifier') return undefined;
  return callee.property.name;
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A spec overriding a MockStore selector restores it, so the override cannot leak into another spec file.',
    },
    schema: [],
    messages: {
      overrideWithoutReset:
        'This spec calls `overrideSelector` but never `resetSelectors`. Spec files share a module registry and the facade is a root singleton, so the override outlives this file — the symptom is a *different* spec failing, or passing for the wrong reason, with no way to reproduce it by running either file alone. Add `afterEach(() => store.resetSelectors())`.',
    },
  },
  create(context) {
    const overrides: Rule.Node[] = [];
    let resets = false;

    return {
      CallExpression(node) {
        const name = calleeName(node);
        if (name === OVERRIDE) overrides.push(node);
        if (name === RESET) resets = true;
      },
      'Program:exit'() {
        if (resets) return;
        for (const node of overrides) {
          context.report({ node, messageId: 'overrideWithoutReset' });
        }
      },
    };
  },
};
