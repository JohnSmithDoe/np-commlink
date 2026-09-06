/* ─── why ─────────────────────────────────────────────────────────
 * The keypad renders glyph characters rather than ion-icons. A glyph carries
 * its own accessible name where it is a word, needs one line of aria where it
 * is a symbol, and keeps the busiest template in the module out of the icon
 * checker entirely.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { CalcKey } from './calc.types';

export const CALC_KEYS: readonly CalcKey[] = [
  {
    id: 'clear',
    glyph: 'C',
    emit: 'clear',
    kind: 'action',
    labelKey: marker('coprocessor.calc.key.clear'),
  },
  {
    id: 'open',
    glyph: '(',
    emit: '(',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.open'),
  },
  {
    id: 'close',
    glyph: ')',
    emit: ')',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.close'),
  },
  {
    id: 'back',
    glyph: '⌫',
    emit: 'back',
    kind: 'action',
    labelKey: marker('coprocessor.calc.key.back'),
  },

  { id: '7', glyph: '7', emit: '7', kind: 'digit' },
  { id: '8', glyph: '8', emit: '8', kind: 'digit' },
  { id: '9', glyph: '9', emit: '9', kind: 'digit' },
  {
    id: 'divide',
    glyph: '÷',
    emit: '/',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.divide'),
  },

  { id: '4', glyph: '4', emit: '4', kind: 'digit' },
  { id: '5', glyph: '5', emit: '5', kind: 'digit' },
  { id: '6', glyph: '6', emit: '6', kind: 'digit' },
  {
    id: 'multiply',
    glyph: '×',
    emit: '*',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.multiply'),
  },

  { id: '1', glyph: '1', emit: '1', kind: 'digit' },
  { id: '2', glyph: '2', emit: '2', kind: 'digit' },
  { id: '3', glyph: '3', emit: '3', kind: 'digit' },
  {
    id: 'minus',
    glyph: '−',
    emit: '-',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.minus'),
  },

  { id: '0', glyph: '0', emit: '0', kind: 'digit' },
  {
    id: 'decimal',
    glyph: ',',
    emit: ',',
    kind: 'digit',
    labelKey: marker('coprocessor.calc.key.decimal'),
  },
  {
    id: 'equals',
    glyph: '=',
    emit: 'equals',
    kind: 'action',
    labelKey: marker('coprocessor.calc.key.equals'),
  },
  {
    id: 'plus',
    glyph: '+',
    emit: '+',
    kind: 'operator',
    labelKey: marker('coprocessor.calc.key.plus'),
  },
];

export const CALC_ERROR_KEYS = {
  empty: marker('coprocessor.calc.error.empty'),
  incomplete: marker('coprocessor.calc.error.incomplete'),
  syntax: marker('coprocessor.calc.error.syntax'),
  'divide-by-zero': marker('coprocessor.calc.error.divide-by-zero'),
  'not-finite': marker('coprocessor.calc.error.not-finite'),
};
