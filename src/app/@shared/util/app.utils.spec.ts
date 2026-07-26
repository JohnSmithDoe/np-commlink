import { AbstractControl } from '@angular/forms';
import { InputCustomEvent } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../model/app.types';
import { IBaseItem } from '../model/base-item.types';
import {
  itemHasCategory,
  matchesId,
  matchesItemExactly,
  matchesItemExactlyIdx as matchesItemExactlyIndex,
  matchesNameExactly,
  matchesSearch,
  matchesSearchExactly,
  matchesSearchString,
  matchingTxt,
  matchingTxtIsNotEmpty,
  parseNumberInput,
  revealedSideFromDrag,
  uuidv4,
  validateNameInput,
} from './app.utils';
import { mockBaseItem } from '../testing/test-data';

const baseItem = (over: Partial<IBaseItem> = {}): IBaseItem => ({
  id: 'id-1',
  name: 'Apple',
  createdAt: '2024-01-01',
  ...over,
});

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

const inputEvent = (value: string | null): InputCustomEvent =>
  ({ detail: { value } }) as InputCustomEvent;

const control = (value: string): AbstractControl =>
  ({ value }) as AbstractControl;

describe('app.utils', () => {
  describe('uuidv4', () => {
    it('produces a valid, unique v4 uuid', () => {
      const id = uuidv4();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(uuidv4()).not.toBe(id);
    });
  });

  describe('revealedSideFromDrag', () => {
    it('returns "end" when dragged past the positive trigger amount', () => {
      expect(revealedSideFromDrag(dragEvent(200))).toBe('end');
    });

    it('returns "start" when dragged past the negative trigger amount', () => {
      expect(revealedSideFromDrag(dragEvent(-200))).toBe('start');
    });

    it('returns false within the trigger threshold', () => {
      expect(revealedSideFromDrag(dragEvent(50))).toBeUndefined();
    });

    it('respects a custom trigger amount', () => {
      expect(revealedSideFromDrag(dragEvent(50), 40)).toBe('end');
    });
  });

  describe('matchingTxt helpers', () => {
    it('trims and lower-cases strings and item names', () => {
      expect(matchingTxt('  ApPlE ')).toBe('apple');
      expect(matchingTxt(baseItem({ name: '  Milk ' }))).toBe('milk');
    });

    it('detects non-empty text', () => {
      expect(matchingTxtIsNotEmpty('x')).toBe(true);
      expect(matchingTxtIsNotEmpty('  ')).toBe(false);
      expect(matchingTxtIsNotEmpty()).toBe(false);
    });
  });

  describe('matching', () => {
    it('matchesNameExactly compares normalized names', () => {
      expect(
        matchesNameExactly(
          baseItem({ name: 'Apple' }),
          baseItem({ name: 'apple' })
        )
      ).toBe(true);
      expect(
        matchesNameExactly(
          baseItem({ name: 'Apple' }),
          baseItem({ name: 'Pear' })
        )
      ).toBe(false);
    });

    it('matchesId compares by id', () => {
      expect(matchesId(baseItem({ id: 'a' }), baseItem({ id: 'a' }))).toBe(
        true
      );
      expect(matchesId(baseItem({ id: 'a' }), baseItem({ id: 'b' }))).toBe(
        false
      );
    });

    it('matchesItemExactly finds by id first, then by name', () => {
      const target = baseItem({ id: 'x', name: 'Milk' });
      const byId = baseItem({ id: 'x', name: 'renamed' });
      const byName = baseItem({ id: 'y', name: 'milk' });
      expect(matchesItemExactly(target, [byName, byId])).toBe(byId);
      expect(matchesItemExactly(target, [byName])).toBe(byName);
      expect(
        matchesItemExactly(target, [baseItem({ id: 'z', name: 'z' })])
      ).toBeUndefined();
    });

    it('matchesItemExactlyIdx returns the index of the match', () => {
      const list = [
        baseItem({ id: 'a', name: 'a' }),
        baseItem({ id: 'b', name: 'b' }),
      ];
      expect(
        matchesItemExactlyIndex(baseItem({ id: 'b', name: 'b' }), list)
      ).toBe(1);
      expect(
        matchesItemExactlyIndex(baseItem({ id: 'c', name: 'c' }), list)
      ).toBe(-1);
    });

    it('matchesSearch / matchesSearchString do case-insensitive substring matches', () => {
      expect(matchesSearch(baseItem({ name: 'Banana' }), 'ana')).toBe(true);
      expect(matchesSearch('Banana', 'xyz')).toBe(false);
      expect(matchesSearchString('Banana', 'BAN')).toBe(true);
      expect(matchesSearchString('Banana')).toBe(true);
    });

    it('matchesSearchExactly requires a full normalized match', () => {
      expect(matchesSearchExactly('Milk', 'milk')).toBe(true);
      expect(matchesSearchExactly('Milk', 'mil')).toBe(false);
      expect(matchesSearchExactly('')).toBe(true);
    });

    it('itemHasCategory checks the item categoryIds for the given id', () => {
      const item = baseItem({ categoryIds: ['c-fruit', 'c-fresh'] });
      expect(itemHasCategory(item, 'c-fruit')).toBe(true);
      expect(itemHasCategory(item, 'c-fresh')).toBe(true);
      expect(itemHasCategory(item, 'c-veg')).toBe(false);
      // an item without categoryIds never matches
      expect(itemHasCategory(baseItem(), 'c-fruit')).toBe(false);
    });
  });

  describe('parseNumberInput', () => {
    it('parses a numeric string', () => {
      expect(parseNumberInput(inputEvent('42'))).toBe(42);
    });

    it('defaults empty input to 0', () => {
      expect(parseNumberInput(inputEvent(''))).toBe(0);
      expect(parseNumberInput(inputEvent(null))).toBe(0);
    });
  });

  describe('validateNameInput', () => {
    it('flags empty names', () => {
      const validator = validateNameInput([], null);
      expect(validator(control(' '.repeat(3)))).toEqual({ empty: true });
    });

    it('passes a unique name', () => {
      const validator = validateNameInput(
        [mockBaseItem({ name: 'Milk' })],
        null
      );
      expect(validator(control('Bread'))).toBeNull();
    });

    it('flags a duplicate of another item', () => {
      const existing = mockBaseItem({ id: 'a', name: 'Milk' });
      const validator = validateNameInput([existing], null);
      expect(validator(control('Milk'))).toEqual({ duplicate: true });
    });

    it('allows the item to keep its own name while editing', () => {
      const editing = mockBaseItem({ id: 'a', name: 'Milk' });
      const validator = validateNameInput([editing], editing);
      expect(validator(control('Milk'))).toBeNull();
    });
  });
});
