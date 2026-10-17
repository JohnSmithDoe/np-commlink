import { RuleTester } from 'eslint';
import { rule as actionEventKeysAreIdentifiers } from './action-event-keys-are-identifiers.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const group = (events: string): string =>
  `export const VitalsActions = createActionGroup({ source: 'Vitals', events: { ${events} } });`;

typescript.run(
  'action-event-keys-are-identifiers',
  actionEventKeysAreIdentifiers,
  {
    valid: [
      {
        code: group(
          'load: emptyProps(), loaded: (vitals) => ({ vitals }), setTaken: props()'
        ),
      },
      { code: group('...createItemListActionEvents(), setTaken: props()') },
      { code: group('save2: emptyProps()') },
      { code: "const labels = { 'Add Item': 1, AddItem: 2 };" },
      { code: "createActionGroup({ source: 'Vitals', events: EVENTS });" },
    ],
    invalid: [
      {
        code: group("'Add Item': emptyProps()"),
        errors: [
          {
            messageId: 'quotedEventKey',
            data: { key: 'Add Item', suggestion: 'addItem' },
          },
        ],
      },
      {
        code: group("'addItem': emptyProps()"),
        errors: [
          {
            messageId: 'quotedEventKey',
            data: { key: 'addItem', suggestion: 'addItem' },
          },
        ],
      },
      {
        code: group('AddItem: emptyProps()'),
        errors: [{ messageId: 'nonCamelEventKey', data: { key: 'AddItem' } }],
      },
      {
        code: group('load: emptyProps(), add_item: emptyProps()'),
        errors: [{ messageId: 'nonCamelEventKey', data: { key: 'add_item' } }],
      },
    ],
  }
);
