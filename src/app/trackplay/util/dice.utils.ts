import {
  DICE_MAX,
  DiceTally,
  DieFaces,
  DieRoll,
  PoolRoll,
} from '../model/dice.types';
import { DicePool } from '../model/trackplay.types';

type RandomSource = () => number;

export const prefersStill = (): boolean =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function withDie(
  dice: readonly DieFaces[],
  faces: DieFaces
): DieFaces[] {
  if (dice.length >= DICE_MAX) return [...dice];
  return [...dice, faces].toSorted((a, b) => a - b);
}

export function withoutDieAt(
  dice: readonly DieFaces[],
  index: number
): DieFaces[] {
  return dice.filter((_, at) => at !== index);
}

export function tallyDice(dice: readonly DieFaces[]): DiceTally[] {
  const counts = new Map<DieFaces, number>();
  for (const faces of dice) {
    counts.set(faces, (counts.get(faces) ?? 0) + 1);
  }
  return [...counts].map(([faces, count]) => ({ faces, count }));
}

function rollDie(faces: DieFaces, random: RandomSource): number {
  return Math.floor(random() * faces) + 1;
}

export function rollPool(
  pool: DicePool,
  random: RandomSource = Math.random
): PoolRoll {
  const dice = pool.dice.map((faces): DieRoll => ({
    faces,
    value: rollDie(faces, random),
  }));

  return { dice, total: dice.reduce((sum, die) => sum + die.value, 0) };
}
