/* ─── why ─────────────────────────────────────────────────────────
 * R6 — docs/footguns.md
 *
 * Ionic's own docs: "The ion-toast component has role='status' and
 * aria-live='polite'… This causes screen readers to only announce the
 * toast message and header, meaning buttons and icons will not be
 * announced." So a toast carrying the only path to an action loses that
 * path entirely for screen-reader users. A dismiss-only button is fine —
 * what makes a button an affordance rather than chrome is a `handler`.
 *
 * The rule cannot verify that the action also exists somewhere persistent,
 * so an intentional interactive toast (an undo that supersedes its
 * predecessor) is a suppression naming that decision — which is the point:
 * the exception becomes a recorded one instead of an unmarked one.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  hasProperty,
  isCreateCall,
  overlayKind,
  property,
} from '../lib/overlay-options.ts';
import type { CallExpression } from '../lib/overlay-options.ts';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R6] A toast button is not the only path to its action.',
    },
    schema: [],
    messages: {
      toastButtonIsUnannounced:
        'This toast button is not announced: ion-toast is role="status" + aria-live="polite", which reads only the header and message. An action reachable *only* here is unreachable for a screen-reader user — duplicate it somewhere persistent, or use an alert. If the toast is deliberately an interactive affordance, disable this rule on the line and say why. See docs/footguns.md R6.',
    },
  },
  create(context) {
    return {
      CallExpression(node: CallExpression) {
        if (!isCreateCall(node)) return;
        if (node.callee.type !== 'MemberExpression') return;
        if (overlayKind(node.callee.object) !== 'toast') return;

        const [options] = node.arguments;
        if (options?.type !== 'ObjectExpression') return;
        const buttons = property(options, 'buttons');
        if (buttons?.type !== 'Property') return;
        if (buttons.value.type !== 'ArrayExpression') return;

        for (const button of buttons.value.elements) {
          if (button?.type !== 'ObjectExpression') continue;
          if (!hasProperty(button, 'handler')) continue;
          context.report({
            node: button as Rule.Node,
            messageId: 'toastButtonIsUnannounced',
          });
        }
      },
    };
  },
};
