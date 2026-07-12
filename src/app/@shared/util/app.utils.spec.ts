import { AbstractControl } from '@angular/forms';
import { InputCustomEvent } from '@ionic/angular';
import { IBaseItem, TIonDragEvent } from '../types';
import {
  checkItemOptionsOnDrag,
  hasQuantity,
  isGlobalItem,
  isShoppingItem,
  isStorageItem,
  isTaskItem,
  matchesCategory,
  matchesCategoryExactly,
  matchesId,
  matchesItemExactly,
  matchesItemExactlyIdx,
  matchesNameExactly,
  matchesSearch,
  matchesSearchExactly,
  matchesSearchString,
  matchingTxt,
  matchingTxtIsEmpty,
  matchingTxtIsNotEmpty,
  parseNumberInput,
  uuidv4,
  validateNameInput,
} from './app.utils';
import {
  mockGlobalItem,
  mockShoppingItem,
  mockStorageItem,
  mockTaskItem,
} from '../testing/test-data';

const baseItem = (over: Partial<IBaseItem> = {}): IBaseItem => ({
  id: 'id-1',
  name: 'Apple',
  createdAt: '2024-01-01',
  ...over,
});

describe('app.utils', () => {
  describe('type guards', () => {
    it('isGlobalItem detects the "unit" property', () => {
      expect(isGlobalItem(mockGlobalItem())).toBe(true);
      expect(isGlobalItem(mockStorageItem())).toBe(false);
    });

    it('isStorageItem detects an own "bestBefore" property', () => {
      expect(isStorageItem(mockStorageItem({ bestBefore: '2024-05-01' }))).toBe(
        true
      );
      // storage item without an explicit bestBefore key is not detected
      expect(isStorageItem(mockStorageItem())).toBe(false);
      expect(isStorageItem(undefined)).toBe(false);
    });

    it('isTaskItem detects an own "prio" property', () => {
      expect(isTaskItem(mockTaskItem({ prio: 1 }))).toBe(true);
      expect(isTaskItem(mockTaskItem())).toBe(false);
    });

    it('isShoppingItem detects the "state" property', () => {
      expect(isShoppingItem(mockShoppingItem())).toBe(true);
      expect(isShoppingItem(mockGlobalItem())).toBe(false);
    });

    it('hasQuantity requires both quantity and name', () => {
      expect(hasQuantity(mockStorageItem({ quantity: 3 }))).toBe(true);
      expect(hasQuantity({ quantity: 3 })).toBe(false);
      expect(hasQuantity(mockGlobalItem())).toBe(false);
      expect(hasQuantity(undefined)).toBe(false);
    });
  });

  describe('uuidv4', () => {
    it('produces a valid, unique v4 uuid', () => {
      const id = uuidv4();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(uuidv4()).not.toBe(id);
    });
  });

  describe('checkItemOptionsOnDrag', () => {
    const dragEvent = (amount: number): TIonDragEvent =>
      ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

    it('returns "end" when dragged past the positive trigger amount', () => {
      expect(checkItemOptionsOnDrag(dragEvent(200))).toBe('end');
    });

    it('returns "start" when dragged past the negative trigger amount', () => {
      expect(checkItemOptionsOnDrag(dragEvent(-200))).toBe('start');
    });

    it('returns false within the trigger threshold', () => {
      expect(checkItemOptionsOnDrag(dragEvent(50))).toBe(false);
    });

    it('respects a custom trigger amount', () => {
      expect(checkItemOptionsOnDrag(dragEvent(50), 40)).toBe('end');
    });
  });

  describe('matchingTxt helpers', () => {
    it('trims and lower-cases strings and item names', () => {
      expect(matchingTxt('  ApPlE ')).toBe('apple');
      expect(matchingTxt(baseItem({ name: '  Milk ' }))).toBe('milk');
    });

    it('detects empty / non-empty text', () => {
      expect(matchingTxtIsEmpty('   ')).toBe(true);
      expect(matchingTxtIsEmpty(undefined)).toBe(true);
      expect(matchingTxtIsNotEmpty('x')).toBe(true);
      expect(matchingTxtIsNotEmpty('  ')).toBe(false);
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
        matchesItemExactlyIdx(baseItem({ id: 'b', name: 'b' }), list)
      ).toBe(1);
      expect(
        matchesItemExactlyIdx(baseItem({ id: 'c', name: 'c' }), list)
      ).toBe(-1);
    });

    it('matchesSearch / matchesSearchString do case-insensitive substring matches', () => {
      expect(matchesSearch(baseItem({ name: 'Banana' }), 'ana')).toBe(true);
      expect(matchesSearch('Banana', 'xyz')).toBe(false);
      expect(matchesSearchString('Banana', 'BAN')).toBe(true);
      expect(matchesSearchString('Banana', undefined)).toBe(true);
    });

    it('matchesSearchExactly requires a full normalized match', () => {
      expect(matchesSearchExactly('Milk', 'milk')).toBe(true);
      expect(matchesSearchExactly('Milk', 'mil')).toBe(false);
      expect(matchesSearchExactly('', undefined)).toBe(true);
    });

    it('matchesCategory / matchesCategoryExactly inspect the category array', () => {
      const item = baseItem({ category: ['Fruit', 'Fresh'] });
      expect(matchesCategory(item, 'fru')).toBe(true);
      expect(matchesCategoryExactly(item, 'fruit')).toBe(true);
      expect(matchesCategoryExactly(item, 'fru')).toBe(false);
      expect(matchesCategory(baseItem(), 'x')).toBe(false);
    });
  });

  describe('parseNumberInput', () => {
    const inputEvent = (value: string | null): InputCustomEvent =>
      ({ detail: { value } }) as InputCustomEvent;

    it('parses a numeric string', () => {
      expect(parseNumberInput(inputEvent('42'))).toBe(42);
    });

    it('defaults empty input to 0', () => {
      expect(parseNumberInput(inputEvent(''))).toBe(0);
      expect(parseNumberInput(inputEvent(null))).toBe(0);
    });
  });

  describe('validateNameInput', () => {
    const control = (value: string): AbstractControl =>
      ({ value }) as AbstractControl;

    it('flags empty names', () => {
      const validator = validateNameInput([], null);
      expect(validator(control('   '))).toEqual({ empty: true });
    });

    it('passes a unique name', () => {
      const validator = validateNameInput(
        [mockStorageItem({ name: 'Milk' })],
        null
      );
      expect(validator(control('Bread'))).toBeNull();
    });

    it('flags a duplicate of another item', () => {
      const existing = mockStorageItem({ id: 'a', name: 'Milk' });
      const validator = validateNameInput([existing], null);
      expect(validator(control('Milk'))).toEqual({ duplicate: true });
    });

    it('allows the item to keep its own name while editing', () => {
      const editing = mockStorageItem({ id: 'a', name: 'Milk' });
      const validator = validateNameInput([editing], editing);
      expect(validator(control('Milk'))).toBeNull();
    });
  });
});
