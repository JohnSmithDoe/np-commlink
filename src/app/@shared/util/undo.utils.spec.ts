import { UndoEntry } from '../model/undo.types';
import { indexOfNewestIn, newestIn, withoutIndex } from './undo.utils';

const STASH = '_storage';
const SHOPPING = '_shopping';

const entry = (name: string, scope: string): UndoEntry => ({
  scope,
  name,
  action: { type: `[Test] restore ${name}` },
});

const milk = entry('Milk', STASH);
const bread = entry('Bread', STASH);
const butter = entry('Butter', SHOPPING);

describe('newestIn', () => {
  it('returns the last matching entry, not the first', () => {
    expect(newestIn([milk, butter, bread], STASH)).toBe(bread);
  });

  it('returns undefined for a scope with no entries', () => {
    expect(newestIn([milk, bread], SHOPPING)).toBeUndefined();
  });

  it('returns undefined for an empty stack', () => {
    expect(newestIn([], STASH)).toBeUndefined();
  });
});

describe('indexOfNewestIn', () => {
  it('finds the last matching position', () => {
    expect(indexOfNewestIn([milk, butter, bread], STASH)).toBe(2);
  });

  it('returns -1 for a scope with no entries', () => {
    expect(indexOfNewestIn([milk], SHOPPING)).toBe(-1);
  });
});

describe('withoutIndex', () => {
  it('removes only the named position', () => {
    expect(withoutIndex([milk, butter, bread], 1)).toEqual([milk, bread]);
  });

  it('returns an unchanged copy for a negative index', () => {
    const entries = [milk, butter];
    expect(withoutIndex(entries, -1)).toEqual(entries);
    expect(withoutIndex(entries, -1)).not.toBe(entries);
  });
});
