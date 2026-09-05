export const DIE_FACES = [4, 6, 8, 10, 12, 20, 100] as const;

export type DieFaces = (typeof DIE_FACES)[number];

export const DICE_PER_GROUP_MAX = 30;
export const DICE_MODIFIER_MAX = 999;

export interface DieRoll {
  faces: DieFaces;
  value: number;
}

export interface PoolRoll {
  dice: DieRoll[];
  modifier: number;
  sum: number;
  total: number;
}
