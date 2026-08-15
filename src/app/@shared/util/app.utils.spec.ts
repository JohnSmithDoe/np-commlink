import { InputCustomEvent } from '@ionic/angular/standalone';
import { IonDragEvent } from '../model/app.types';
import { BaseItem } from '../model/base-item.types';
import {
  findMatchingItem,
  indexOfMatchingItem,
  matcherFor,
  matchesId,
  matchesNameExactly,
  matchesSearchExactly,
  matchingTxt,
  matchingTxtIsNotEmpty,
  moveInList,
  parseNumberInput,
  revealedSideFromDrag,
  uuidv4,
} from './app.utils';

const baseItem = (over: Partial<BaseItem> = {}): BaseItem => ({
  id: 'id-1',
  name: 'Apple',
  createdAt: '2024-01-01',
  ...over,
});

const dragEvent = (amount: number): IonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as IonDragEvent;

const inputEvent = (value: string | null): InputCustomEvent =>
  ({ detail: { value } }) as InputCustomEvent;

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

    it('findMatchingItem finds by id first, then by name', () => {
      const target = baseItem({ id: 'x', name: 'Milk' });
      const byId = baseItem({ id: 'x', name: 'renamed' });
      const byName = baseItem({ id: 'y', name: 'milk' });
      expect(findMatchingItem(target, [byName, byId])).toBe(byId);
      expect(findMatchingItem(target, [byName])).toBe(byName);
      expect(
        findMatchingItem(target, [baseItem({ id: 'z', name: 'z' })])
      ).toBeUndefined();
    });

    it('indexOfMatchingItem returns the index of the match', () => {
      const list = [
        baseItem({ id: 'a', name: 'a' }),
        baseItem({ id: 'b', name: 'b' }),
      ];
      expect(indexOfMatchingItem(baseItem({ id: 'b', name: 'b' }), list)).toBe(
        1
      );
      expect(indexOfMatchingItem(baseItem({ id: 'c', name: 'c' }), list)).toBe(
        -1
      );
    });

    it('matcherFor matches an item or a string, case-insensitive, needle trimmed', () => {
      const matches = matcherFor('  BAN ');
      expect(matches('Banana')).toBe(true);
      expect(matches(baseItem({ name: 'Banana' }))).toBe(true);
      expect(matches('Cherry')).toBe(false);
      expect(matcherFor()('anything')).toBe(true);
    });

    it('matchesSearchExactly requires a full normalized match', () => {
      expect(matchesSearchExactly('Milk', 'milk')).toBe(true);
      expect(matchesSearchExactly('Milk', 'mil')).toBe(false);
      expect(matchesSearchExactly('')).toBe(true);
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
});

describe('moveInList', () => {
  it('moves an entry down', () => {
    expect(moveInList(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an entry up', () => {
    expect(moveInList(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the order alone when nothing moved', () => {
    expect(moveInList(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
});
