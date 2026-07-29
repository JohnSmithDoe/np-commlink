'use strict';

const {
  hasProperty,
  isCreateCall,
  isDecidable,
  overlayKind,
  setsAriaLabelViaHtmlAttributes,
} = require('../lib/overlay-options');

// R4, controller half — docs/ionic-a11y-practices.md
//
// The declarative overlays are covered by `overlay-has-name`; this is the same
// rule for `ModalController.create(…)` & friends, where the seam is
// `htmlAttributes` rather than an attribute. Ionic derives a name from `header`
// (alert, action sheet) or `message` (loading) when one is set, and never for a
// modal — so only the modal case is unconditional.
//
// Only an object *literal* is decidable. Options built by a helper
// (`deleteConfirmAlert(...)`) or spread from a variable are passed over rather
// than guessed at: a gate that reports what it cannot know trains people to
// disable it.
const NAME_SOURCES = {
  modal: [],
  alert: ['header', 'subHeader', 'message'],
  actionsheet: ['header'],
  loading: ['message'],
};

module.exports = {
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
      CallExpression(node) {
        if (!isCreateCall(node)) return;
        const kind = overlayKind(node.callee.object);
        const sources = kind ? NAME_SOURCES[kind] : undefined;
        if (!sources) return;

        const [options] = node.arguments;
        if (options?.type !== 'ObjectExpression') return;
        if (!isDecidable(options)) return;
        if (sources.some((source) => hasProperty(options, source))) return;
        if (setsAriaLabelViaHtmlAttributes(options)) return;

        context.report({
          node: options,
          messageId: 'overlayOptionsNeedName',
          data: {
            kind:
              kind === 'actionsheet'
                ? 'Action sheet'
                : `${kind[0].toUpperCase()}${kind.slice(1)}`,
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
