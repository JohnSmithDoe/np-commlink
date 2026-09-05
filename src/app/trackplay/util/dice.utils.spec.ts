import { DICE_MAX, DieFaces } from '../model/dice.types';
import { DicePool } from '../model/trackplay.types';
import { rollPool, tallyDice, withDie, withoutDieAt } from './dice.utils';

const pool = (dice: DicePool['dice'] = [6, 6]): DicePool => ({ dice });

describe('withDie', () => {
  it('keeps the table sorted, so equal dice sit together', () => {
    expect(withDie([6, 20], 4)).toEqual([4, 6, 20]);
    expect(withDie([4, 20], 6)).toEqual([4, 6, 20]);
  });

  it('takes a second die of a face already there', () => {
    expect(withDie([6], 6)).toEqual([6, 6]);
  });

  it('refuses to take more dice than the table holds', () => {
    const full: DieFaces[] = Array.from({ length: DICE_MAX }, () => 6);

    expect(withDie(full, 20)).toHaveLength(DICE_MAX);
  });
});

describe('withoutDieAt', () => {
  it('takes back exactly the die tapped, not every die of its face', () => {
    expect(withoutDieAt([6, 6, 20], 0)).toEqual([6, 20]);
  });

  it('leaves the table alone for an index nothing occupies', () => {
    expect(withoutDieAt([6, 20], 7)).toEqual([6, 20]);
  });
});

describe('tallyDice', () => {
  it('counts each face once, in the order it first appears', () => {
    expect(tallyDice([6, 6, 20, 6])).toEqual([
      { faces: 6, count: 3 },
      { faces: 20, count: 1 },
    ]);
  });

  it('tallies an empty table to nothing', () => {
    expect(tallyDice([])).toEqual([]);
  });
});

describe('rollPool', () => {
  it('rolls one die per die on the table, in table order', () => {
    const roll = rollPool(pool([6, 6, 20]), () => 0.5);

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

  it('totals every die it rolled', () => {
    expect(rollPool(pool([6, 6, 20]), () => 0.5).total).toBe(19);
  });

  it('rolls nothing off an empty table', () => {
    const roll = rollPool(pool([]), () => 0.5);

    expect(roll.dice).toEqual([]);
    expect(roll.total).toBe(0);
  });
});
