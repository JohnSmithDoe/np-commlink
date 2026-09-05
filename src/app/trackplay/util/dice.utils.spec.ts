import { DicePool } from '../model/trackplay.types';
import {
  clampDiceCount,
  clampModifier,
  poolDiceCount,
  rollBreakdown,
  rollPool,
} from './dice.utils';

const pool = (overrides: Partial<DicePool> = {}): DicePool => ({
  groups: [{ id: 'a', faces: 6, count: 2 }],
  modifier: 0,
  ...overrides,
});

describe('clampDiceCount', () => {
  it.each([
    [0, 1],
    [-4, 1],
    [Number.NaN, 1],
    [2.7, 2],
    [999, 30],
  ])('turns %s into %s', (input, expected) => {
    expect(clampDiceCount(input)).toBe(expected);
  });
});

describe('clampModifier', () => {
  it('keeps a negative modifier', () => {
    expect(clampModifier(-3)).toBe(-3);
  });

  it('caps both directions', () => {
    expect(clampModifier(5000)).toBe(999);
    expect(clampModifier(-5000)).toBe(-999);
  });
});

describe('poolDiceCount', () => {
  it('sums every group', () => {
    const counted = poolDiceCount(
      pool({
        groups: [
          { id: 'a', faces: 6, count: 2 },
          { id: 'b', faces: 20, count: 1 },
        ],
      })
    );

    expect(counted).toBe(3);
  });
});

describe('rollPool', () => {
  it('rolls one die per counted die, in group order', () => {
    const roll = rollPool(
      pool({
        groups: [
          { id: 'a', faces: 6, count: 2 },
          { id: 'b', faces: 20, count: 1 },
        ],
      }),
      () => 0.5
    );

    expect(roll.dice).toEqual([
      { faces: 6, value: 4 },
      { faces: 6, value: 4 },
      { faces: 20, value: 11 },
    ]);
  });

  it('never rolls below 1 or above the face count', () => {
    const lowest = rollPool(pool(), () => 0);
    const highest = rollPool(pool(), () => 0.999999);

    expect(lowest.dice.map((die) => die.value)).toEqual([1, 1]);
    expect(highest.dice.map((die) => die.value)).toEqual([6, 6]);
  });

  it('adds the modifier to the sum, not to a die', () => {
    const roll = rollPool(pool({ modifier: 3 }), () => 0.5);

    expect(roll.sum).toBe(8);
    expect(roll.total).toBe(11);
  });

  it('rolls nothing for an empty pool', () => {
    const roll = rollPool(pool({ groups: [], modifier: 2 }), () => 0.5);

    expect(roll.dice).toEqual([]);
    expect(roll.total).toBe(2);
  });
});

describe('rollBreakdown', () => {
  it('leaves a zero modifier out', () => {
    expect(rollBreakdown(rollPool(pool(), () => 0.5))).toBe('4 + 4');
  });

  it('spells a negative modifier as a subtraction', () => {
    expect(rollBreakdown(rollPool(pool({ modifier: -2 }), () => 0.5))).toBe(
      '4 + 4 − 2'
    );
  });
});
