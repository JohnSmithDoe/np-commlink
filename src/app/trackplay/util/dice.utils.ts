import {
  DICE_MODIFIER_MAX,
  DICE_PER_GROUP_MAX,
  DieFaces,
  DieRoll,
  PoolRoll,
} from '../model/dice.types';
import { DicePool } from '../model/trackplay.types';

type RandomSource = () => number;

export function clampDiceCount(count: number): number {
  const whole = Math.trunc(count);
  if (!Number.isFinite(whole) || whole < 1) return 1;
  return Math.min(whole, DICE_PER_GROUP_MAX);
}

export function clampModifier(modifier: number): number {
  const whole = Math.trunc(modifier);
  if (!Number.isFinite(whole)) return 0;
  return Math.max(Math.min(whole, DICE_MODIFIER_MAX), -DICE_MODIFIER_MAX);
}

export function poolDiceCount(pool: DicePool): number {
  return pool.groups.reduce((count, group) => count + group.count, 0);
}

function rollDie(faces: DieFaces, random: RandomSource): number {
  return Math.floor(random() * faces) + 1;
}

export function rollPool(
  pool: DicePool,
  random: RandomSource = Math.random
): PoolRoll {
  const dice = pool.groups.flatMap((group) =>
    Array.from({ length: clampDiceCount(group.count) }, (): DieRoll => ({
      faces: group.faces,
      value: rollDie(group.faces, random),
    }))
  );
  const sum = dice.reduce((total, die) => total + die.value, 0);
  const modifier = clampModifier(pool.modifier);

  return { dice, modifier, sum, total: sum + modifier };
}

export function rollBreakdown(roll: PoolRoll): string {
  const values = roll.dice.map((die) => `${die.value}`).join(' + ');
  if (roll.modifier === 0) return values;
  const sign = roll.modifier > 0 ? '+' : '−';
  return `${values} ${sign} ${Math.abs(roll.modifier)}`;
}
