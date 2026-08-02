/* ─── why ─────────────────────────────────────────────────────────
 * R4, controller half — docs/ionic-a11y-practices.md
 *
 * The same rule as `a11y-overlay-has-name` for `ModalController.create(…)`
 * & friends, where the seam is `htmlAttributes` rather than an attribute.
 * Ionic derives a name from `header` (alert, action sheet) or `message`
 * (loading) when one is set, and never for a modal — so only the modal
 * case is unconditional.
 *
 * Only an object *literal* is decidable. Options built by a helper
 * (`deleteConfirmAlert(...)`) or spread from a variable are passed over
 * rather than guessed at: a gate that reports what it cannot know trains
 * people to disable it.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import {
  hasProperty,
  isCreateCall,
  isDecidable,
  overlayKind,
  setsAriaLabelViaHtmlAttributes,
} from '../lib/overlay-options.ts';
import type { CallExpression } from '../lib/overlay-options.ts';

const NAME_SOURCES: Record<string, string[]> = {
  modal: [],
  alert: ['header', 'subHeader', 'message'],
  actionsheet: ['header'],
  loading: ['message'],
};

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '[Ionic a11y R4] A controller-presented Ionic overlay has a name — from its content, or from htmlAttributes.',
    },
    schema: [],
    messages: {
      overlayOptionsNeedName:
        '{{kind}} overlay with no accessible name.{{alternatives}} Name it through the htmlAttributes seam: htmlAttributes: {{"{"}} \'aria-label\': this.#translate.instant(marker(\'<domain>.a11y.<what>\')) {{"}"}}. See docs/ionic-a11y-practices.md R4.',
    },
  },
  create(context) {
    return {
      CallExpression(node: CallExpression) {
        if (!isCreateCall(node)) return;
        if (node.callee.type !== 'MemberExpression') return;
        const kind = overlayKind(node.callee.object);
        const sources = kind ? NAME_SOURCES[kind] : undefined;
        if (!sources || !kind) return;

        const [options] = node.arguments;
        if (options?.type !== 'ObjectExpression') return;
        if (!isDecidable(options)) return;
        if (sources.some((source) => hasProperty(options, source))) return;
        if (setsAriaLabelViaHtmlAttributes(options)) return;

        context.report({
          node: options as Rule.Node,
          messageId: 'overlayOptionsNeedName',
          data: {
            kind:
              kind === 'actionsheet'
                ? 'Action sheet'
                : `${kind[0]?.toUpperCase() ?? ''}${kind.slice(1)}`,
            alternatives:
              sources.length > 0
                ? ` Ionic derives one from \`${sources.join('` / `')}\`, none of which is set.`
                : ' Ionic derives none for a modal.',
          },
        });
      },
    };
  },
};
