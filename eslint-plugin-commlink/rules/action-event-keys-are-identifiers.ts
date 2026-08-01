import type { Rule } from 'eslint';

// `createActionGroup({ events })` keys are camelCase identifiers.
//
// `createActionGroup` camelCases the key to build the creator either way, so
// `'Add Item'` and `addItem` produce the *same* creator name and the same call
// sites. What differs is the generated wire `type`: `[Source] Add Item` versus
// `[Source] addItem`. Writing the identifier makes those the same token, so an
// action is greppable by the one name it has — search `addItem` and you find the
// definition, every dispatch, every effect, and any log line carrying the type.
//
// The rule reports the quoted form even when the string happens to be a valid
// identifier (`'addItem'`), because the hazard is the quoting itself: a quoted
// key invites a space, and the day it gains one nothing breaks loudly — the
// creator keeps its name while the wire string silently changes underneath
// anything that matched on it.

const FACTORY = 'createActionGroup';
const EVENTS = 'events';
const IDENTIFIER = /^[a-z][A-Za-z0-9]*$/;

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Action-group event keys are camelCase identifiers, so the wire type and the code you write are the same token.',
    },
    schema: [],
    messages: {
      quotedEventKey:
        "Action-group event keys are camelCase identifiers, not quoted strings: `{{suggestion}}:`, never `'{{key}}':`. createActionGroup camelCases either form to the same creator, so what changes is only the wire type — and quoting is what lets a space creep in, which changes that type while every call site keeps compiling.",
      nonCamelEventKey:
        'Action-group event key `{{key}}` is not camelCase. The generated type becomes `[Source] {{key}}`, so the wire string stops matching the name you would grep for.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== FACTORY)
          return;
        const [config] = node.arguments;
        if (config?.type !== 'ObjectExpression') return;

        const events = config.properties.find(
          (candidate) =>
            candidate.type === 'Property' &&
            candidate.key.type === 'Identifier' &&
            candidate.key.name === EVENTS
        );
        if (events?.type !== 'Property') return;
        if (events.value.type !== 'ObjectExpression') return;

        for (const event of events.value.properties) {
          if (event.type !== 'Property') continue;

          if (event.key.type === 'Literal') {
            const key = String(event.key.value);
            // The camelCase createActionGroup would have derived, so the message
            // can name the exact replacement rather than describe it.
            const suggestion = key
              .split(/[\s_-]+/)
              .map((word, index) =>
                index === 0
                  ? word.charAt(0).toLowerCase() + word.slice(1)
                  : word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join('');
            context.report({
              node: event.key as Rule.Node,
              messageId: 'quotedEventKey',
              data: { key, suggestion },
            });
            continue;
          }

          if (event.key.type !== 'Identifier') continue;
          if (IDENTIFIER.test(event.key.name)) continue;
          context.report({
            node: event.key as Rule.Node,
            messageId: 'nonCamelEventKey',
            data: { key: event.key.name },
          });
        }
      },
    };
  },
};
