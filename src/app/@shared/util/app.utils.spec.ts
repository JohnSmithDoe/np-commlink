import { AbstractControl } from '@angular/forms';
import { InputCustomEvent } from '@ionic/angular';
import { describe, expect, it } from 'vitest';
import { IBaseItem, TIonDragEvent } from '../types';
import {
  checkItemOptionsOnDrag,
  matchesItemExactly,
  matchesItemExactlyIdx,
  matchesSearch,
  matchesSearchExactly,
  matchingTxt,
  parseNumberInput,
  validateNameInput,
} from './app.utils';

const item = (id: string, name: string): IBaseItem => ({
  id,
  name,
  createdAt: '2026-01-01',
});

const dragEvent = (amount: number) =>
  ({ detail: { amount } }) as unknown as TIonDragEvent;

const inputEvent = (value: string | null) =>
  ({ detail: { value } }) as unknown as InputCustomEvent;

const control = (value: unknown) => ({ value }) as AbstractControl;

describe('app.utils', () => {
  describe('matchingTxt', () => {
    it('trims and lowercases a raw string', () => {
      expect(matchingTxt('  Hello ')).toBe('hello');
    });

    it('reads and normalizes an item name', () => {
      expect(matchingTxt(item('1', ' Foo '))).toBe('foo');
    });
  });

  describe('matchesSearch', () => {
    it('matches on a case-insensitive substring', () => {
      expect(matchesSearch(item('1', 'Grocery'), 'ROC')).toBe(true);
    });

    it('does not match when the query is absent from the name', () => {
      expect(matchesSearch('Grocery', 'xyz')).toBe(false);
    });
  });

  describe('matchesSearchExactly', () => {
    it('matches only on the full normalized name', () => {
      expect(matchesSearchExactly('Foo', 'foo')).toBe(true);
      expect(matchesSearchExactly('Foo', 'fo')).toBe(false);
    });

    it('treats a missing query as the empty string', () => {
      expect(matchesSearchExactly('Foo')).toBe(false);
      expect(matchesSearchExactly('')).toBe(true);
    });
  });

  describe('matchesItemExactly', () => {
    const others = [item('1', 'Foo'), item('2', 'Bar')];

    it('prefers an id match over the name', () => {
      expect(matchesItemExactly(item('1', 'renamed'), others)).toBe(others[0]);
    });

    it('falls back to a name match when the id is unknown', () => {
      expect(matchesItemExactly(item('9', 'bar'), others)).toBe(others[1]);
    });

    it('returns undefined when nothing matches', () => {
      expect(matchesItemExactly(item('9', 'none'), others)).toBeUndefined();
    });
  });

  describe('matchesItemExactlyIdx', () => {
    const others = [item('1', 'Foo'), item('2', 'Bar')];

    it('returns the index of the matched item', () => {
      expect(matchesItemExactlyIdx(item('2', 'x'), others)).toBe(1);
    });

    it('returns -1 when nothing matches', () => {
      expect(matchesItemExactlyIdx(item('9', 'none'), others)).toBe(-1);
    });
  });

  describe('parseNumberInput', () => {
    it('parses a numeric string value', () => {
      expect(parseNumberInput(inputEvent('42'))).toBe(42);
    });

    it('falls back to 0 for empty or null values', () => {
      expect(parseNumberInput(inputEvent(''))).toBe(0);
      expect(parseNumberInput(inputEvent(null))).toBe(0);
    });
  });

  describe('checkItemOptionsOnDrag', () => {
    it('returns "end" when dragged far enough to the right', () => {
      expect(checkItemOptionsOnDrag(dragEvent(200))).toBe('end');
    });

    it('returns "start" when dragged far enough to the left', () => {
      expect(checkItemOptionsOnDrag(dragEvent(-200))).toBe('start');
    });

    it('returns false below the trigger threshold', () => {
      expect(checkItemOptionsOnDrag(dragEvent(10))).toBe(false);
    });
  });

  describe('validateNameInput', () => {
    it('flags an empty name', () => {
      const validate = validateNameInput([item('1', 'Foo')], null);
      expect(validate(control(''))).toEqual({ empty: true });
    });

    it('accepts a name that is not already taken', () => {
      const validate = validateNameInput([item('1', 'Foo')], null);
      expect(validate(control('unique'))).toBeNull();
    });

    it('flags a name that duplicates another item', () => {
      const validate = validateNameInput([item('1', 'Foo')], null);
      expect(validate(control('Foo'))).toEqual({ duplicate: true });
    });

    it('allows an item to keep its own name while editing', () => {
      const existing = item('1', 'Foo');
      const validate = validateNameInput([existing], existing);
      expect(validate(control('Foo'))).toBeNull();
    });
  });
});
